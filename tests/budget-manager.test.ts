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

  it('returns correct stats', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000 });
    await mgr.recordUsage(3000);
    const stats = await mgr.getStats();
    expect(stats[0].used).toBe(3000);
    expect(stats[0].remaining).toBe(7000);
    expect(stats[0].percentage).toBeCloseTo(30);
  });

  it('returns remaining budget', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 10000 });
    await mgr.recordUsage(6000);
    const remaining = await mgr.getRemainingBudget();
    expect(remaining).toBe(4000);
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

  it('resets budgets', async () => {
    const mgr = new BudgetManager({ dailyBudgetTokens: 1000 });
    await mgr.recordUsage(900);
    await mgr.reset();
    await expect(mgr.checkBudget(900)).resolves.toBeUndefined();
  });
});
