import { BudgetExceededError, ProviderNotConfiguredError } from '../src/errors';

describe('BudgetExceededError', () => {
  it('creates error with correct message and stats', () => {
    const stats = {
      scope: 'global' as const,
      scopeKey: 'daily',
      used: 9500,
      limit: 10000,
      remaining: 500,
      percentage: 95.0,
    };
    const err = new BudgetExceededError(stats);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(BudgetExceededError);
    expect(err.name).toBe('BudgetExceededError');
    expect(err.stats).toBe(stats);
    expect(err.message).toContain('Token budget exceeded');
    expect(err.message).toContain('global:daily');
    expect(err.message).toContain('9500/10000');
    expect(err.message).toContain('95.0%');
  });
});

describe('ProviderNotConfiguredError', () => {
  it('creates error with correct message', () => {
    const err = new ProviderNotConfiguredError('openai');

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProviderNotConfiguredError);
    expect(err.name).toBe('ProviderNotConfiguredError');
    expect(err.message).toContain('openai');
    expect(err.message).toContain('Install the corresponding peer dependency');
  });
});
