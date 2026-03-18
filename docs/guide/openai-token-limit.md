# How to Limit OpenAI API Token Usage in Node.js

Setting token limits on OpenAI API calls (GPT-4o, GPT-4, GPT-3.5) prevents unexpected bills and runaway costs. **llm-spend-guard** enforces budgets *before* any request reaches OpenAI.

## Setup

```bash
npm install llm-spend-guard openai
```

```typescript
import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

const guard = new LLMGuard({
  dailyBudgetTokens: 100_000,
  maxTokensPerRequest: 10_000,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
guard.wrapOpenAI(openai);
```

## Making Guarded Requests

```typescript
const response = await guard.openai.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
});
```

If this request would exceed your daily budget, it throws `BudgetExceededError` and **OpenAI is never called**. No tokens consumed, no money spent.

## Per-User Token Limits for OpenAI

```typescript
const guard = new LLMGuard({
  dailyBudgetTokens: 500_000,   // global daily cap
  userBudgetTokens: 10_000,     // per-user daily cap
});

// Pass userId with each request
const response = await guard.openai.chat(
  {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
    max_tokens: 500,
  },
  { userId: 'user-123' }
);
```

## Checking Remaining OpenAI Budget

```typescript
const remaining = await guard.getRemainingBudget({ userId: 'user-123' });
console.log(`Tokens left: ${remaining}`);
```

## Auto-Truncating Long Prompts

```typescript
const guard = new LLMGuard({
  dailyBudgetTokens: 50_000,
  autoTruncate: true,  // trims messages to fit budget instead of rejecting
});
```

The guard keeps system messages intact, preserves recent messages, and drops oldest messages first.
