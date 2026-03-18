# How to Set Token Budgets for Google Gemini API in Node.js

Control Google Gemini API costs by enforcing token budgets before requests are sent. **llm-spend-guard** blocks over-budget Gemini requests locally.

## Setup

```bash
npm install llm-spend-guard @google/generative-ai
```

```typescript
import { LLMGuard } from 'llm-spend-guard';
import { GoogleGenerativeAI } from '@google/generative-ai';

const guard = new LLMGuard({
  dailyBudgetTokens: 100_000,
  maxTokensPerRequest: 10_000,
});

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
guard.wrapGemini(gemini);
```

## Making Guarded Requests

```typescript
const response = await guard.gemini.chat({
  model: 'gemini-1.5-pro',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
});
```

## Per-User Gemini Budget

```typescript
const response = await guard.gemini.chat(
  {
    model: 'gemini-1.5-pro',
    messages: [{ role: 'user', content: 'Summarize this document' }],
    max_tokens: 1000,
  },
  { userId: 'user-789' }
);
```

## Multi-Provider Setup

You can guard OpenAI, Claude, and Gemini with a single guard instance:

```typescript
const guard = new LLMGuard({ dailyBudgetTokens: 200_000 });

guard.wrapOpenAI(new OpenAI());
guard.wrapAnthropic(new Anthropic());
guard.wrapGemini(new GoogleGenerativeAI(process.env.GEMINI_API_KEY!));

// All three providers share the same daily budget
```
