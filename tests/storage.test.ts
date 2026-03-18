import { MemoryStorage } from '../src/storage/memory';
import { RedisStorage } from '../src/storage/redis';

describe('MemoryStorage', () => {
  it('get returns null for unknown key', async () => {
    const storage = new MemoryStorage();
    expect(await storage.get('unknown')).toBeNull();
  });

  it('set and get work correctly', async () => {
    const storage = new MemoryStorage();
    const today = new Date().toISOString().slice(0, 10);
    await storage.set('key1', { totalTokens: 100, date: today });
    const result = await storage.get('key1');
    expect(result).toEqual({ totalTokens: 100, date: today });
  });

  it('increment creates entry if not exists', async () => {
    const storage = new MemoryStorage();
    const result = await storage.increment('new-key', 500);
    expect(result.totalTokens).toBe(500);
  });

  it('increment adds to existing entry', async () => {
    const storage = new MemoryStorage();
    await storage.increment('key1', 100);
    const result = await storage.increment('key1', 200);
    expect(result.totalTokens).toBe(300);
  });

  it('reset removes entry', async () => {
    const storage = new MemoryStorage();
    await storage.increment('key1', 100);
    await storage.reset('key1');
    expect(await storage.get('key1')).toBeNull();
  });

  it('returns null for stale (old date) entries', async () => {
    const storage = new MemoryStorage();
    await storage.set('key1', { totalTokens: 100, date: '2020-01-01' });
    const result = await storage.get('key1');
    expect(result).toBeNull();
  });

  it('increment after stale entry resets tokens', async () => {
    const storage = new MemoryStorage();
    await storage.set('key1', { totalTokens: 1000, date: '2020-01-01' });
    // get() returns null for stale, so increment starts fresh
    const result = await storage.increment('key1', 50);
    expect(result.totalTokens).toBe(50);
  });
});

describe('RedisStorage', () => {
  function mockRedisClient() {
    const store = new Map<string, string>();
    return {
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string, _ex: string, _ttl: number) => {
        store.set(key, value);
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      _store: store,
    };
  }

  it('get returns null for unknown key', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis);
    expect(await storage.get('unknown')).toBeNull();
  });

  it('set and get work correctly', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis);
    const today = new Date().toISOString().slice(0, 10);
    await storage.set('key1', { totalTokens: 100, date: today });
    const result = await storage.get('key1');
    expect(result).toEqual({ totalTokens: 100, date: today });
  });

  it('uses prefix for keys', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis, 'myapp:');
    await storage.set('budget', { totalTokens: 50, date: '2026-01-01' });
    expect(redis.set).toHaveBeenCalledWith(
      'myapp:budget',
      expect.any(String),
      'EX',
      expect.any(Number),
    );
  });

  it('uses default prefix', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis);
    await storage.set('key1', { totalTokens: 50, date: '2026-01-01' });
    expect(redis.set).toHaveBeenCalledWith(
      'llm-spend-guard:key1',
      expect.any(String),
      'EX',
      expect.any(Number),
    );
  });

  it('increment creates entry if not exists', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis);
    const result = await storage.increment('new-key', 500);
    expect(result.totalTokens).toBe(500);
  });

  it('increment adds to existing entry', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis);
    await storage.increment('key1', 100);
    const result = await storage.increment('key1', 200);
    expect(result.totalTokens).toBe(300);
  });

  it('reset removes entry', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis);
    await storage.increment('key1', 100);
    await storage.reset('key1');
    expect(redis.del).toHaveBeenCalledWith('llm-spend-guard:key1');
    expect(await storage.get('key1')).toBeNull();
  });

  it('sets TTL until midnight', async () => {
    const redis = mockRedisClient();
    const storage = new RedisStorage(redis);
    await storage.set('key1', { totalTokens: 100, date: '2026-01-01' });
    const ttl = redis.set.mock.calls[0][3];
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(86400); // max 24 hours
  });
});
