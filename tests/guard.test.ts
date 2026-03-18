import { LLMGuard } from '../src/guard';

describe('LLMGuard', () => {
  it('creates guard with default memory storage', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    expect(guard).toBeDefined();
  });

  it('wraps OpenAI client', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const mockClient = { chat: { completions: { create: jest.fn() } } };
    const provider = guard.wrapOpenAI(mockClient);
    expect(provider).toBeDefined();
    expect(guard.openai).toBe(provider);
  });

  it('wraps Anthropic client', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const mockClient = { messages: { create: jest.fn() } };
    const provider = guard.wrapAnthropic(mockClient);
    expect(provider).toBeDefined();
    expect(guard.anthropic).toBe(provider);
  });

  it('wraps Gemini client', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const mockClient = { getGenerativeModel: jest.fn() };
    const provider = guard.wrapGemini(mockClient);
    expect(provider).toBeDefined();
    expect(guard.gemini).toBe(provider);
  });

  it('throws when accessing unwrapped provider', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    expect(() => guard.openai).toThrow('OpenAI not configured');
    expect(() => guard.anthropic).toThrow('Anthropic not configured');
    expect(() => guard.gemini).toThrow('Gemini not configured');
  });

  it('returns stats and remaining budget', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const stats = await guard.getStats();
    expect(stats).toHaveLength(1);
    const remaining = await guard.getRemainingBudget();
    expect(remaining).toBe(10000);
  });

  it('resets budgets', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const mgr = guard.getBudgetManager();
    await mgr.recordUsage(5000);
    expect(await guard.getRemainingBudget()).toBe(5000);
    await guard.reset();
    expect(await guard.getRemainingBudget()).toBe(10000);
  });

  it('creates guard with autoTruncate config', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000, autoTruncate: true });
    expect(guard).toBeDefined();
  });

  it('creates guard with onBudgetWarning callback', () => {
    const warnings: any[] = [];
    const guard = new LLMGuard({
      dailyBudgetTokens: 10000,
      onBudgetWarning: (level, stats) => warnings.push({ level, stats }),
    });
    expect(guard).toBeDefined();
  });

  it('getBudgetManager returns the underlying manager', () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000 });
    const mgr = guard.getBudgetManager();
    expect(mgr).toBeDefined();
    expect(typeof mgr.checkBudget).toBe('function');
    expect(typeof mgr.recordUsage).toBe('function');
  });

  it('passes context to getStats', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000, userBudgetTokens: 5000 });
    const mgr = guard.getBudgetManager();
    await mgr.recordUsage(1000, { userId: 'u1' });
    const stats = await guard.getStats({ userId: 'u1' });
    const userStat = stats.find(s => s.scope === 'user');
    expect(userStat).toBeDefined();
    expect(userStat!.used).toBe(1000);
  });

  it('passes context to getRemainingBudget', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000, userBudgetTokens: 5000 });
    const mgr = guard.getBudgetManager();
    await mgr.recordUsage(3000, { userId: 'u1' });
    const remaining = await guard.getRemainingBudget({ userId: 'u1' });
    expect(remaining).toBe(2000); // min of (10000-3000, 5000-3000)
  });

  it('passes context to reset', async () => {
    const guard = new LLMGuard({ dailyBudgetTokens: 10000, userBudgetTokens: 5000 });
    const mgr = guard.getBudgetManager();
    await mgr.recordUsage(3000, { userId: 'u1' });
    await guard.reset({ userId: 'u1' });
    const remaining = await guard.getRemainingBudget({ userId: 'u1' });
    expect(remaining).toBe(5000);
  });
});
