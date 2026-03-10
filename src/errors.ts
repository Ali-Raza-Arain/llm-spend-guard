import { BudgetStats } from './types';

export class BudgetExceededError extends Error {
  public readonly stats: BudgetStats;

  constructor(stats: BudgetStats) {
    super(
      `Token budget exceeded for ${stats.scope}:${stats.scopeKey}. ` +
      `Used ${stats.used}/${stats.limit} tokens (${stats.percentage.toFixed(1)}%)`
    );
    this.name = 'BudgetExceededError';
    this.stats = stats;
  }
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Provider SDK not available: ${provider}. Install the corresponding peer dependency.`);
    this.name = 'ProviderNotConfiguredError';
  }
}
