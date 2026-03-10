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
});
