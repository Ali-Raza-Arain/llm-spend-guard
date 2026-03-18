---
title: How to Stop Your OpenAI API Bill from Spiraling Out of Control
published: false
description: A 3-line Node.js solution to enforce real-time token budgets for OpenAI, Anthropic Claude, and Google Gemini API calls
tags: javascript, ai, node, openai
---

# How to Stop Your OpenAI API Bill from Spiraling Out of Control

If you're building with LLM APIs (OpenAI, Anthropic Claude, Google Gemini), you've probably had that moment — you check your dashboard and realize a runaway loop or an uncapped user session just burned through your entire monthly budget in minutes.

**There's no built-in way to set spending limits across these SDKs.** OpenAI's usage limits are post-hoc (money already spent), Anthropic has no budget controls, and Gemini has rate limits but not token budgets.

I built [llm-spend-guard](https://www.npmjs.com/package/llm-spend-guard) to fix this.

## What It Does

It wraps your existing LLM SDK calls and enforces token budgets **before** any request is sent. If a request would exceed your budget, it gets blocked instantly — the API is never called, no money wasted.

```
Your Code --> llm-spend-guard --> LLM API
                  |
                  ├── Estimates tokens BEFORE the request
                  ├── Checks budget (global, per-user, per-session)
                  ├── Over budget? BLOCKS the request
                  └── Under budget? Sends request, tracks usage
```

## Quick Start (3 Lines)

```typescript
import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

const guard = new LLMGuard({ dailyBudgetTokens: 100_000 });

const openai = new OpenAI();
guard.wrapOpenAI(openai);

// Use guard.openai instead of openai
const response = await guard.openai.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
});
```

If this request would exceed 100K tokens for the day, it throws `BudgetExceededError` and OpenAI is **never called**.

## Works with All Major Providers

```typescript
guard.wrapOpenAI(openai);       // GPT-4o, GPT-4, etc.
guard.wrapAnthropic(anthropic); // Claude
guard.wrapGemini(gemini);       // Gemini 1.5 Pro
```

All three share the same budget pool or can have separate limits.

## Per-User Budgets (For SaaS Apps)

This is where it gets powerful. If you're building a multi-tenant app:

```typescript
const guard = new LLMGuard({
  dailyBudgetTokens: 1_000_000,  // 1M total across all users
  userBudgetTokens: 10_000,      // 10K per user per day
  storage: new RedisStorage(new Redis()),
});

await guard.openai.chat(
  { model: 'gpt-4o', messages, max_tokens: 500 },
  { userId: req.user.id }  // per-user tracking
);
```

## Express.js Middleware

```typescript
import { expressMiddleware, budgetErrorHandler } from 'llm-spend-guard';

app.use(expressMiddleware(guard));  // auto-extracts userId, sessionId
app.use(budgetErrorHandler);       // returns 429 when budget exceeded
```

## Key Features

- **Pre-request blocking** — No money spent on over-budget requests
- **Multi-provider** — OpenAI + Anthropic Claude + Google Gemini
- **Multi-scope** — Global, per-user, per-session, per-route budgets
- **Auto-truncation** — Intelligently trims prompts to fit remaining budget
- **Redis support** — Production-ready with shared state across instances
- **Express/Next.js** — Built-in middleware
- **TypeScript-first** — Full type safety
- **18.6KB** — Lightweight, single dependency (tiktoken)

## Links

- **npm**: [npmjs.com/package/llm-spend-guard](https://www.npmjs.com/package/llm-spend-guard)
- **GitHub**: [github.com/Ali-Raza-Arain/llm-spend-guard](https://github.com/Ali-Raza-Arain/llm-spend-guard)
- **Docs**: [ali-raza-arain.github.io/llm-spend-guard](https://ali-raza-arain.github.io/llm-spend-guard/)

---

If you've been bitten by surprise LLM bills, give it a try and let me know what you think!
