import { BudgetManager } from '../src/budget-manager';
import { MemoryStorage } from '../src/storage/memory';
import { BudgetExceededError } from '../src/errors';
import { AlertLevel, BudgetStats } from '../src/types';

describe('BudgetManager', () => {
  it('allows requests within budget', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000 });
    await expect(mgr.checkBudget(5000)).resolves.toBeUndefined();
  });

  it('rejects requests exceeding daily budget', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 1000 });
    await mgr.recordUsage(800);
    await expect(mgr.checkBudget(300)).rejects.toThrow(BudgetExceededError);
  });

  it('rejects requests exceeding per-request limit', async () => {
    const mgr = new BudgetManager({ maxTokensPerRequest: 500 });
    await expect(mgr.checkBudget(600)).rejects.toThrow(BudgetExceededError);
  });

  it('enforces per-user budget', async () => {
    const mgr = new BudgetManager({ userBudgetTokens: 1000 });
    await mgr.recordUsage(900, { userId: 'u1' });
    await expect(mgr.checkBudget(200, { userId: 'u1' })).rejects.toThrow(BudgetExceededError);
    // Different user should be fine
    await expect(mgr.checkBudget(200, { userId: 'u2' })).resolves.toBeUndefined();
  });

  it('enforces session budget', async () => {
    const mgr = new BudgetManager({ sessionBudgetTokens: 500 });
    await mgr.recordUsage(400, { sessionId: 's1' });
    await expect(mgr.checkBudget(200, { sessionId: 's1' })).rejects.toThrow(BudgetExceededError);
  });

  it('enforces global budget', async () => {
    const mgr = new BudgetManager({ globalBudgetTokens: 5000 });
    await mgr.recordUsage(4500);
    await expect(mgr.checkBudget(600)).rejects.toThrow(BudgetExceededError);
    await expect(mgr.checkBudget(400)).resolves.toBeUndefined();
  });

  it('enforces route budget', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000 });
    await mgr.recordUsage(9500, { route: '/api/chat' });
    // Route /api/chat has 9500 used, daily also has 9500 — route check fails
    await expect(mgr.checkBudget(600, { route: '/api/chat' })).rejects.toThrow(BudgetExceededError);
    // Different route has 0 used on route scope, and daily still has 500 remaining
    await expect(mgr.checkBudget(400, { route: '/api/other' })).resolves.toBeUndefined();
  });

  it('route scope uses globalBudgetTokens as fallback limit', async () => {
    const mgr = new BudgetManager({ globalBudgetTokens: 1000 });
    await mgr.recordUsage(900, { route: '/api/chat' });
    await expect(mgr.checkBudget(200, { route: '/api/chat' })).rejects.toThrow(BudgetExceededError);
  });

  it('route scope is not created when no daily or global budget', async () => {
    const mgr = new BudgetManager({ userBudgetTokens: 1000 });
    // With only userBudgetTokens and no userId, no scopes to check
    await expect(mgr.checkBudget(200, { route: '/api/chat' })).resolves.toBeUndefined();
  });

  it('returns correct stats', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000 });
    await mgr.recordUsage(3000);
    const stats = await mgr.getStats();
    expect(stats[0].used).toBe(3000);
    expect(stats[0].remaining).toBe(7000);
    expect(stats[0].percentage).toBeCloseTo(30);
  });

  it('returns stats for multiple scopes', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000, userBudgetTokens: 5000 });
    await mgr.recordUsage(2000, { userId: 'u1' });
    const stats = await mgr.getStats({ userId: 'u1' });
    expect(stats).toHaveLength(2);
    expect(stats.find(s => s.scope === 'user')).toBeDefined();
  });

  it('returns remaining budget', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000 });
    await mgr.recordUsage(6000);
    const remaining = await mgr.getRemainingBudget();
    expect(remaining).toBe(4000);
  });

  it('returns Infinity when no scopes configured', async () => {
    const mgr = new BudgetManager({});
    const remaining = await mgr.getRemainingBudget();
    expect(remaining).toBe(Infinity);
  });

  it('returns 0 when budget fully consumed', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 1000 });
    await mgr.recordUsage(1500);
    const remaining = await mgr.getRemainingBudget();
    expect(remaining).toBe(0);
  });

  it('returns minimum remaining across scopes', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000, userBudgetTokens: 2000 });
    await mgr.recordUsage(1500, { userId: 'u1' });
    const remaining = await mgr.getRemainingBudget({ userId: 'u1' });
    expect(remaining).toBe(500); // min(10000-1500, 2000-1500)
  });

  it('fires alert callbacks', async () => {
    const alerts: { level: AlertLevel; stats: BudgetStats }[] = [];
    const mgr = new BudgetManager(
      { dailyBudgetTokens: 1000 },
      new MemoryStorage(),
      (level, stats) => alerts.push({ level, stats }),
    );

    await mgr.recordUsage(500);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe('warning_50');

    await mgr.recordUsage(310);
    expect(alerts).toHaveLength(2);
    expect(alerts[1].level).toBe('warning_80');

    await mgr.recordUsage(200);
    expect(alerts).toHaveLength(3);
    expect(alerts[2].level).toBe('exceeded');
  });

  it('does not fire duplicate alerts', async () => {
    const alerts: { level: AlertLevel }[] = [];
    const mgr = new BudgetManager(
      { dailyBudgetTokens: 1000 },
      new MemoryStorage(),
      (level) => alerts.push({ level }),
    );

    await mgr.recordUsage(500);
    await mgr.recordUsage(10); // still over 50%, no new alert
    expect(alerts).toHaveLength(1);
  });

  it('does not fire alerts when no callback configured', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 100 });
    // This should not throw
    await mgr.recordUsage(90);
  });

  it('resets budgets', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 1000 });
    await mgr.recordUsage(900);
    await mgr.reset();
    await expect(mgr.checkBudget(900)).resolves.toBeUndefined();
  });

  it('resets clears fired alerts', async () => {
    const alerts: string[] = [];
    const mgr = new BudgetManager(
      { dailyBudgetTokens: 1000 },
      new MemoryStorage(),
      (level) => alerts.push(level),
    );

    await mgr.recordUsage(500);
    expect(alerts).toHaveLength(1);

    await mgr.reset();
    await mgr.recordUsage(500);
    // Alert should fire again after reset
    expect(alerts).toHaveLength(2);
  });

  it('checks per-request limit error has correct stats', async () => {
    const mgr = new BudgetManager({ maxTokensPerRequest: 500 });
    try {
      await mgr.checkBudget(600);
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(BudgetExceededError);
      const budgetErr = err as BudgetExceededError;
      expect(budgetErr.stats.scope).toBe('global');
      expect(budgetErr.stats.scopeKey).toBe('request');
      expect(budgetErr.stats.used).toBe(600);
      expect(budgetErr.stats.limit).toBe(500);
    }
  });

  it('uses provided storage adapter', async () => {
    const storage = new MemoryStorage();
    const mgr = new BudgetManager({ dailyBudgetTokens: 1000 }, storage);
    await mgr.recordUsage(500);
    const value = await storage.get('daily');
    expect(value?.totalTokens).toBe(500);
  });
});
