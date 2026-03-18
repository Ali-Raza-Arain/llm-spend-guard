# Getting Started with llm-spend-guard

## Installation

```bash
npm install llm-spend-guard
```

Then install the provider SDK(s) you use:

```bash
# Pick one or more
npm install openai                  # For OpenAI (GPT-4o, GPT-4, etc.)
npm install @anthropic-ai/sdk       # For Anthropic (Claude)
npm install @google/generative-ai   # For Google Gemini

# Optional: Redis storage for production
npm install ioredis
```

## Quick Start (3 Lines of Code)

```typescript
import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

// 1. Create the guard with your budget
const guard = new LLMGuard({
  dailyBudgetTokens: 100_000,
  maxTokensPerRequest: 10_000,
  onBudgetWarning(level, stats) {
    console.log(`Budget alert [${level}]: ${stats.percentage.toFixed(1)}% used`);
  },
});

// 2. Wrap your existing SDK client
const openai = new OpenAI();
guard.wrapOpenAI(openai);

// 3. Use guard.openai instead of openai directly
const response = await guard.openai.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the meaning of life?' }],
  max_tokens: 500,
});

console.log(response.choices[0].message.content);
```

That's it. If any request would exceed the budget, it throws `BudgetExceededError` and the API is never called.

## Configuration Options

```typescript
const guard = new LLMGuard({
  dailyBudgetTokens: 100_000,       // Max tokens per day (resets at midnight)
  globalBudgetTokens: 1_000_000,    // Lifetime global cap
  userBudgetTokens: 10_000,         // Max per user
  sessionBudgetTokens: 5_000,       // Max per session
  maxTokensPerRequest: 10_000,      // Max per single request
  autoTruncate: true,               // Auto-trim prompts to fit budget
  storage: new MemoryStorage(),     // Default. Use RedisStorage for production.
  onBudgetWarning(level, stats) {
    // level: 'warning_50' | 'warning_80' | 'exceeded'
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dailyBudgetTokens` | `number` | `undefined` | Max tokens per day. Auto-resets at midnight. |
| `globalBudgetTokens` | `number` | `undefined` | Lifetime total token cap. |
| `userBudgetTokens` | `number` | `undefined` | Max tokens per unique user. |
| `sessionBudgetTokens` | `number` | `undefined` | Max tokens per session. |
| `maxTokensPerRequest` | `number` | `undefined` | Hard cap on a single request. |
| `autoTruncate` | `boolean` | `false` | Automatically shorten prompts to fit remaining budget. |
| `storage` | `StorageAdapter` | `MemoryStorage` | Where usage data is stored. |
| `onBudgetWarning` | `function` | `undefined` | Called at 50%, 80%, and 100% usage. |

## Next Steps

- [OpenAI Token Limits](/guide/openai-token-limit) — Full OpenAI setup guide
- [Anthropic Claude Cost Control](/guide/anthropic-cost-control) — Claude integration
- [Google Gemini Budget](/guide/gemini-budget) — Gemini integration
- [Express.js Middleware](/guide/express-middleware) — Server-side integration
