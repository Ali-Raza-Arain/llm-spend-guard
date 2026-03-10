import { StorageAdapter, ScopeUsage } from '../types';

/**
 * Redis storage adapter. Requires `ioredis` as a peer dependency.
 * Usage keys are automatically prefixed and expire at end of day.
 */
export class RedisStorage implements StorageAdapter {
  private client: any;
  private prefix: string;

  constructor(redisClient: any, prefix = 'llm-spend-guard:') {
    this.client = redisClient;
    this.prefix = prefix;
  }

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  private ttlUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
  }

  async get(key: string): Promise<ScopeUsage | null> {
    const raw = await this.client.get(this.key(key));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async set(key: string, value: ScopeUsage): Promise<void> {
    await this.client.set(this.key(key), JSON.stringify(value), 'EX', this.ttlUntilMidnight());
  }

  async increment(key: string, tokens: number): Promise<ScopeUsage> {
    const existing = await this.get(key);
    const updated: ScopeUsage = {
      totalTokens: (existing?.totalTokens ?? 0) + tokens,
      date: new Date().toISOString().slice(0, 10),
    };
    await this.set(key, updated);
    return updated;
  }

  async reset(key: string): Promise<void> {
    await this.client.del(this.key(key));
  }
}
