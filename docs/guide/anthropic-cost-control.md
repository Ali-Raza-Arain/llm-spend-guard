# How to Control Anthropic Claude API Costs in Node.js

Prevent runaway Anthropic Claude API spending by enforcing token budgets before requests are sent. **llm-spend-guard** blocks over-budget requests locally — Claude is never called.

## Setup

```bash
npm install llm-spend-guard @anthropic-ai/sdk
```

```typescript
import { LLMGuard } from 'llm-spend-guard';
import Anthropic from '@anthropic-ai/sdk';

const guard = new LLMGuard({
  dailyBudgetTokens: 100_000,
  maxTokensPerRequest: 10_000,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
guard.wrapAnthropic(anthropic);
```

## Making Guarded Requests

```typescript
const response = await guard.anthropic.chat({
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
  system: 'You are a helpful assistant.',
});
```

## Per-User Claude Budget

```typescript
const guard = new LLMGuard({
  dailyBudgetTokens: 500_000,
  userBudgetTokens: 10_000,
});

const response = await guard.anthropic.chat(
  {
    model: 'claude-sonnet-4-20250514',
    messages: [{ role: 'user', content: 'Explain quantum computing' }],
    max_tokens: 1000,
  },
  { userId: 'user-456' }
);
```

## SaaS Multi-Tenant Example

```typescript
import { LLMGuard, RedisStorage } from 'llm-spend-guard';
import Redis from 'ioredis';

const guard = new LLMGuard({
  userBudgetTokens: 10_000,
  dailyBudgetTokens: 1_000_000,
  storage: new RedisStorage(new Redis()),
  onBudgetWarning(level, stats) {
    if (stats.scope === 'user' && level === 'warning_80') {
      notifyUser(stats.scopeKey.replace('user:', ''), {
        message: `You've used ${stats.percentage.toFixed(0)}% of your daily AI quota.`,
      });
    }
  },
});
```
