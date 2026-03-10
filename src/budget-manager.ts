import {
  BudgetConfig,
  BudgetScope,
  BudgetStats,
  AlertLevel,
  StorageAdapter,
  RequestContext,
} from './types';
import { MemoryStorage } from './storage/memory';
import { BudgetExceededError } from './errors';

interface ScopeCheck {
  scope: BudgetScope;
  key: string;
  limit: number;
}

export class BudgetManager {
  private storage: StorageAdapter;
  private config: BudgetConfig;
  private onWarning?: (level: AlertLevel, stats: BudgetStats) => void;
  private firedAlerts = new Set<string>();

  constructor(
    config: BudgetConfig,
    storage?: StorageAdapter,
    onWarning?: (level: AlertLevel, stats: BudgetStats) => void,
  ) {
    this.config = config;
    this.storage = storage ?? new MemoryStorage();
    this.onWarning = onWarning;
  }

  private buildScopes(ctx: RequestContext): ScopeCheck[] {
    const scopes: ScopeCheck[] = [];
    if (this.config.globalBudgetTokens) {
      scopes.push({ scope: 'global', key: 'global', limit: this.config.globalBudgetTokens });
    }
    if (this.config.dailyBudgetTokens) {
      scopes.push({ scope: 'global', key: 'daily', limit: this.config.dailyBudgetTokens });
    }
    if (this.config.userBudgetTokens && ctx.userId) {
      scopes.push({ scope: 'user', key: `user:${ctx.userId}`, limit: this.config.userBudgetTokens });
    }
    if (this.config.sessionBudgetTokens && ctx.sessionId) {
      scopes.push({ scope: 'session', key: `session:${ctx.sessionId}`, limit: this.config.sessionBudgetTokens });
    }
    if (ctx.route) {
      const limit = this.config.dailyBudgetTokens ?? this.config.globalBudgetTokens;
      if (limit) {
        scopes.push({ scope: 'route', key: `route:${ctx.route}`, limit });
      }
    }
    return scopes;
  }

  async checkBudget(estimatedTokens: number, ctx: RequestContext = {}): Promise<void> {
    // Per-request limit
    if (this.config.maxTokensPerRequest && estimatedTokens > this.config.maxTokensPerRequest) {
      const stats: BudgetStats = {
        scope: 'global',
        scopeKey: 'request',
        used: estimatedTokens,
        limit: this.config.maxTokensPerRequest,
        remaining: 0,
        percentage: 100,
      };
      throw new BudgetExceededError(stats);
    }

    const scopes = this.buildScopes(ctx);
    for (const { scope, key, limit } of scopes) {
      const usage = await this.storage.get(key);
      const used = usage?.totalTokens ?? 0;
      const remaining = limit - used;

      if (estimatedTokens > remaining) {
        const stats: BudgetStats = {
          scope,
          scopeKey: key,
          used,
          limit,
          remaining: Math.max(0, remaining),
          percentage: (used / limit) * 100,
        };
        throw new BudgetExceededError(stats);
      }
    }
  }

  async recordUsage(tokens: number, ctx: RequestContext = {}): Promise<void> {
    const scopes = this.buildScopes(ctx);
    for (const { scope, key, limit } of scopes) {
      const updated = await this.storage.increment(key, tokens);
      this.checkAlerts(scope, key, updated.totalTokens, limit);
    }
  }

  async getStats(ctx: RequestContext = {}): Promise<BudgetStats[]> {
    const scopes = this.buildScopes(ctx);
    const results: BudgetStats[] = [];
    for (const { scope, key, limit } of scopes) {
      const usage = await this.storage.get(key);
      const used = usage?.totalTokens ?? 0;
      results.push({
        scope,
        scopeKey: key,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        percentage: (used / limit) * 100,
      });
    }
    return results;
  }

  async getRemainingBudget(ctx: RequestContext = {}): Promise<number> {
    const scopes = this.buildScopes(ctx);
    let minRemaining = Infinity;
    for (const { key, limit } of scopes) {
      const usage = await this.storage.get(key);
      const used = usage?.totalTokens ?? 0;
      minRemaining = Math.min(minRemaining, limit - used);
    }
    return minRemaining === Infinity ? Infinity : Math.max(0, minRemaining);
  }

  async reset(ctx: RequestContext = {}): Promise<void> {
    const scopes = this.buildScopes(ctx);
    for (const { key } of scopes) {
      await this.storage.reset(key);
    }
    this.firedAlerts.clear();
  }

  private checkAlerts(scope: BudgetScope, key: string, used: number, limit: number): void {
    if (!this.onWarning) return;
    const pct = (used / limit) * 100;
    const stats: BudgetStats = {
      scope,
      scopeKey: key,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      percentage: pct,
    };

    if (pct >= 100 && !this.firedAlerts.has(`${key}:exceeded`)) {
      this.firedAlerts.add(`${key}:exceeded`);
      this.onWarning('exceeded', stats);
    } else if (pct >= 80 && !this.firedAlerts.has(`${key}:warning_80`)) {
      this.firedAlerts.add(`${key}:warning_80`);
      this.onWarning('warning_80', stats);
    } else if (pct >= 50 && !this.firedAlerts.has(`${key}:warning_50`)) {
      this.firedAlerts.add(`${key}:warning_50`);
      this.onWarning('warning_50', stats);
    }
  }
}
