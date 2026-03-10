import { StorageAdapter, ScopeUsage } from '../types';

export class MemoryStorage implements StorageAdapter {
  private store = new Map<string, ScopeUsage>();

  async get(key: string): Promise<ScopeUsage | null> {
    const value = this.store.get(key) ?? null;
    if (value && value.date !== todayStr()) {
      this.store.delete(key);
      return null;
    }
    return value;
  }

  async set(key: string, value: ScopeUsage): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string, tokens: number): Promise<ScopeUsage> {
    const existing = await this.get(key);
    const updated: ScopeUsage = {
      totalTokens: (existing?.totalTokens ?? 0) + tokens,
      date: todayStr(),
    };
    this.store.set(key, updated);
    return updated;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
