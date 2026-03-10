<p align="center">
  <img src="https://img.shields.io/npm/v/llm-spend-guard?style=for-the-badge&color=blue&label=llm-spend-guard" alt="version" />
</p>

<h1 align="center">llm-spend-guard</h1>

<p align="center">
  <strong>Stop your LLM API bills from spiraling out of control.</strong><br/>
  A lightweight Node.js package that enforces real-time token budgets for OpenAI, Anthropic, and Google Gemini API calls.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="license" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="typescript" />
  <img src="https://img.shields.io/badge/tests-28%20passed-green" alt="tests" />
  <img src="https://img.shields.io/badge/bundle-18.6KB-orange" alt="size" />
</p>

---

## The Problem

A single runaway loop, an uncapped user session, or one oversized prompt can burn through your entire LLM budget in minutes. There is no built-in way to set spending limits across OpenAI, Anthropic, or Gemini SDKs.

**llm-spend-guard** wraps your existing LLM SDK calls and enforces token budgets *before* any request is sent to the API. If a request would exceed your budget, it gets blocked instantly — no money wasted.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Compatible Tech Stacks](#compatible-tech-stacks)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration Options](#configuration-options)
- [Usage By Provider](#usage-by-provider)
  - [OpenAI](#openai)
  - [Anthropic (Claude)](#anthropic-claude)
  - [Google Gemini](#google-gemini)
- [Budget Scopes](#budget-scopes)
- [How Guarding Works (Request Lifecycle)](#how-guarding-works-request-lifecycle)
- [Viewing Reports and Stats](#viewing-reports-and-stats)
- [Alert Callbacks (Monitoring)](#alert-callbacks-monitoring)
- [What Happens When Budget Is Exceeded](#what-happens-when-budget-is-exceeded)
- [Auto Truncation](#auto-truncation)
- [Storage Backends](#storage-backends)
- [Framework Integration](#framework-integration)
  - [Express.js](#expressjs)
  - [Next.js API Routes](#nextjs-api-routes)
  - [Fastify / Koa / Hono](#fastify--koa--hono)
- [SaaS Per-User Budget Example](#saas-per-user-budget-example)
- [Full API Reference](#full-api-reference)
- [Running Tests](#running-tests)
- [Publishing to NPM](#publishing-to-npm)
- [Roadmap](#roadmap)
- [License](#license)

---

## How It Works

```
Your Code --> llm-spend-guard --> LLM API (OpenAI / Anthropic / Gemini)
                  |
                  |-- 1. Estimates tokens BEFORE the request
                  |-- 2. Checks all budget scopes (global, user, session, route)
                  |-- 3. If over budget --> BLOCKS the request (throws BudgetExceededError)
                  |-- 4. If auto-truncate enabled --> trims prompt to fit
                  |-- 5. Sends request to LLM API
                  |-- 6. Records actual token usage from response
                  |-- 7. Fires alert callbacks at 50%, 80%, 100% thresholds
```

**Key principle**: The guard sits between your code and the LLM SDK. It estimates cost *before* sending, blocks if over budget, and tracks actual usage *after* the response.

---

## Compatible Tech Stacks

| Category | Supported |
|----------|-----------|
| **Runtime** | Node.js >= 18, Bun, Deno (with Node compat) |
| **Language** | TypeScript, JavaScript (CommonJS and ESM) |
| **LLM Providers** | OpenAI, Anthropic (Claude), Google Gemini |
| **Frameworks** | Express.js, Next.js, Fastify, Koa, Hono, NestJS, or any Node.js server |
| **Storage** | In-memory (default), Redis, or any custom adapter |
| **Use Cases** | REST APIs, SaaS backends, chatbots, AI agents, CLI tools, serverless functions |

**Not compatible with**: Browser/frontend code (this is a server-side package), Python, or non-Node runtimes without Node compatibility.

---

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

# Optional: Redis storage
npm install ioredis
```

---

## Quick Start

```typescript
import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

// 1. Create the guard with your budget
const guard = new LLMGuard({
  dailyBudgetTokens: 100_000,       // 100K tokens per day
  maxTokensPerRequest: 10_000,      // No single request can use more than 10K
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

// 4. Check your budget anytime
const remaining = await guard.getRemainingBudget();
console.log(`Tokens remaining today: ${remaining}`);
```

That's it. If any request would exceed the budget, it throws `BudgetExceededError` and the API is never called.

---

## Configuration Options

```typescript
const guard = new LLMGuard({
  // --- Budget Limits ---
  dailyBudgetTokens: 100_000,       // Max tokens per day (resets at midnight)
  globalBudgetTokens: 1_000_000,    // Lifetime global cap
  userBudgetTokens: 10_000,         // Max per user
  sessionBudgetTokens: 5_000,       // Max per session
  maxTokensPerRequest: 10_000,      // Max per single request

  // --- Behavior ---
  autoTruncate: true,               // Auto-trim prompts to fit budget

  // --- Storage ---
  storage: new MemoryStorage(),     // Default. Use RedisStorage for production.

  // --- Monitoring ---
  onBudgetWarning(level, stats) {
    // level: 'warning_50' | 'warning_80' | 'exceeded'
    // stats: { scope, scopeKey, used, limit, remaining, percentage }
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

---

## Usage By Provider

### OpenAI

```typescript
import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

const guard = new LLMGuard({ dailyBudgetTokens: 100_000 });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
guard.wrapOpenAI(openai);

const res = await guard.openai.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
});
```

### Anthropic (Claude)

```typescript
import { LLMGuard } from 'llm-spend-guard';
import Anthropic from '@anthropic-ai/sdk';

const guard = new LLMGuard({ dailyBudgetTokens: 100_000 });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
guard.wrapAnthropic(anthropic);

const res = await guard.anthropic.chat({
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
  system: 'You are a helpful assistant.',  // Anthropic system prompt
});
```

### Google Gemini

```typescript
import { LLMGuard } from 'llm-spend-guard';
import { GoogleGenerativeAI } from '@google/generative-ai';

const guard = new LLMGuard({ dailyBudgetTokens: 100_000 });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
guard.wrapGemini(gemini);

const res = await guard.gemini.chat({
  model: 'gemini-1.5-pro',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
});
```

---

## Budget Scopes

You can enforce budgets at multiple levels simultaneously:

```
                    +-------------------+
                    |   Global Budget   |  <-- total across everything
                    +-------------------+
                     /        |         \
            +--------+  +--------+  +--------+
            | User A |  | User B |  | User C |  <-- per-user limit
            +--------+  +--------+  +--------+
               |            |
          +---------+  +---------+
          | Session |  | Session |  <-- per-session limit
          +---------+  +---------+
               |
          +---------+
          |  Route  |  <-- per-route limit
          +---------+
```

Pass context with every request to activate scopes:

```typescript
await guard.openai.chat(
  {
    model: 'gpt-4o',
    messages: [...],
    max_tokens: 500,
  },
  {
    userId: 'user-123',       // activates per-user budget
    sessionId: 'sess-abc',    // activates per-session budget
    route: '/api/chat',       // activates per-route budget
  }
);
```

All applicable scopes are checked. If **any** scope is exceeded, the request is blocked.

---

## How Guarding Works (Request Lifecycle)

Here is exactly what happens on every `.chat()` call:

```
Step 1: ESTIMATE
   |  Count tokens in all messages using tiktoken (OpenAI) or heuristic (others)
   |  Add max_tokens (expected output) to get total estimated cost
   v
Step 2: CHECK BUDGET
   |  For each active scope (global, daily, user, session, route):
   |    - Load current usage from storage
   |    - Compare: estimated tokens vs remaining budget
   |    - If over budget --> throw BudgetExceededError (request NEVER sent)
   v
Step 3: AUTO-TRUNCATE (if enabled)
   |  If prompt is too large but truncation is on:
   |    - Keep system message intact
   |    - Keep most recent messages
   |    - Drop oldest messages first
   |    - Truncate text of last message if still too large
   v
Step 4: SEND REQUEST
   |  Forward to actual LLM API (OpenAI/Anthropic/Gemini)
   v
Step 5: RECORD USAGE
   |  Read actual token counts from API response
   |  Update all scope counters in storage
   v
Step 6: FIRE ALERTS
   |  If any scope crosses 50% --> onBudgetWarning('warning_50', stats)
   |  If any scope crosses 80% --> onBudgetWarning('warning_80', stats)
   |  If any scope crosses 100% --> onBudgetWarning('exceeded', stats)
   v
Step 7: RETURN RESPONSE
      Return the original API response to your code
```

---

## Viewing Reports and Stats

### Get Budget Stats

```typescript
// Global stats (all scopes)
const stats = await guard.getStats();
console.log(stats);
```

**Output:**
```json
[
  {
    "scope": "global",
    "scopeKey": "daily",
    "used": 45200,
    "limit": 100000,
    "remaining": 54800,
    "percentage": 45.2
  }
]
```

### Get Per-User Stats

```typescript
const userStats = await guard.getStats({ userId: 'user-123' });
console.log(userStats);
```

**Output:**
```json
[
  {
    "scope": "global",
    "scopeKey": "daily",
    "used": 45200,
    "limit": 100000,
    "remaining": 54800,
    "percentage": 45.2
  },
  {
    "scope": "user",
    "scopeKey": "user:user-123",
    "used": 8300,
    "limit": 10000,
    "remaining": 1700,
    "percentage": 83.0
  }
]
```

### Get Remaining Token Count

```typescript
const remaining = await guard.getRemainingBudget({ userId: 'user-123' });
console.log(`Tokens left: ${remaining}`);
// Output: "Tokens left: 1700"
```

This returns the **minimum** remaining across all active scopes. If the user has 1700 left on their user budget but 54800 left on the daily budget, it returns 1700 (the tightest constraint).

### Build a Usage Dashboard Endpoint

```typescript
app.get('/api/usage', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  const stats = await guard.getStats({ userId });
  const remaining = await guard.getRemainingBudget({ userId });

  res.json({
    budgets: stats.map(s => ({
      scope: s.scope,
      key: s.scopeKey,
      used: s.used,
      limit: s.limit,
      remaining: s.remaining,
      percentUsed: `${s.percentage.toFixed(1)}%`,
    })),
    totalRemaining: remaining,
  });
});
```

**Response:**
```json
{
  "budgets": [
    {
      "scope": "global",
      "key": "daily",
      "used": 45200,
      "limit": 100000,
      "remaining": 54800,
      "percentUsed": "45.2%"
    },
    {
      "scope": "user",
      "key": "user:user-123",
      "used": 8300,
      "limit": 10000,
      "remaining": 1700,
      "percentUsed": "83.0%"
    }
  ],
  "totalRemaining": 1700
}
```

### Reset Budgets

```typescript
// Reset all budgets
await guard.reset();

// Reset for a specific user
await guard.reset({ userId: 'user-123' });
```

---

## Alert Callbacks (Monitoring)

Get notified as budgets are consumed:

```typescript
const guard = new LLMGuard({
  dailyBudgetTokens: 100_000,
  userBudgetTokens: 10_000,
  onBudgetWarning(level, stats) {
    switch (level) {
      case 'warning_50':
        console.log(`[WARN] ${stats.scopeKey} is 50% used (${stats.used}/${stats.limit})`);
        break;
      case 'warning_80':
        console.warn(`[CRITICAL] ${stats.scopeKey} is 80% used!`);
        // Send Slack notification, email alert, etc.
        break;
      case 'exceeded':
        console.error(`[EXCEEDED] ${stats.scopeKey} has exceeded the budget!`);
        // Page on-call, disable feature flag, etc.
        break;
    }
  },
});
```

**Alert levels fire once per scope per threshold** — you won't get spammed with duplicate alerts.

| Level | Fires When | Typical Action |
|-------|-----------|----------------|
| `warning_50` | 50% budget consumed | Log it, update dashboard |
| `warning_80` | 80% budget consumed | Alert team via Slack/email |
| `exceeded` | 100% budget consumed | Block requests, page on-call |

---

## What Happens When Budget Is Exceeded

When a request would exceed any budget scope, the guard throws `BudgetExceededError`:

```typescript
import { BudgetExceededError } from 'llm-spend-guard';

try {
  await guard.openai.chat({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Tell me everything about the universe' }],
    max_tokens: 50_000,
  });
} catch (err) {
  if (err instanceof BudgetExceededError) {
    console.log(err.message);
    // "Token budget exceeded for global:daily. Used 95000/100000 tokens (95.0%)"

    console.log(err.stats);
    // {
    //   scope: 'global',
    //   scopeKey: 'daily',
    //   used: 95000,
    //   limit: 100000,
    //   remaining: 5000,
    //   percentage: 95.0
    // }
  }
}
```

**The LLM API is NEVER called.** No money is spent. The request is blocked locally before it leaves your server.

---

## Auto Truncation

When `autoTruncate: true`, instead of rejecting oversized prompts, the guard intelligently trims them:

```typescript
const guard = new LLMGuard({
  dailyBudgetTokens: 5_000,
  autoTruncate: true,  // Enable smart truncation
});
```

**Truncation strategy:**
1. System messages are always preserved
2. Most recent messages are kept first
3. Oldest messages are dropped
4. If the last message is still too large, its text is trimmed with `...` appended

This is useful for chatbots with long conversation histories — the guard keeps the most relevant context while staying within budget.

---

## Storage Backends

### In-Memory (Default)

```typescript
import { LLMGuard, MemoryStorage } from 'llm-spend-guard';

const guard = new LLMGuard({
  storage: new MemoryStorage(),  // This is the default, no need to specify
  dailyBudgetTokens: 100_000,
});
```

Good for: single-process apps, development, testing.
Limitation: data is lost on restart, not shared across processes.

### Redis (Production)

```typescript
import { LLMGuard, RedisStorage } from 'llm-spend-guard';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const guard = new LLMGuard({
  storage: new RedisStorage(redis, 'myapp:budget:'),  // optional key prefix
  dailyBudgetTokens: 100_000,
});
```

Good for: production, multi-instance, serverless.
Keys auto-expire at midnight (daily reset built-in).

### Custom Adapter

Implement the `StorageAdapter` interface for any backend (PostgreSQL, DynamoDB, file system, etc.):

```typescript
import { LLMGuard, StorageAdapter, ScopeUsage } from 'llm-spend-guard';

const myStorage: StorageAdapter = {
  async get(key: string): Promise<ScopeUsage | null> {
    // Read from your database
    return db.get(key);
  },
  async set(key: string, value: ScopeUsage): Promise<void> {
    // Write to your database
    await db.set(key, value);
  },
  async increment(key: string, tokens: number): Promise<ScopeUsage> {
    // Atomically increment and return updated value
    const existing = await this.get(key) ?? { totalTokens: 0, date: new Date().toISOString().slice(0, 10) };
    existing.totalTokens += tokens;
    await this.set(key, existing);
    return existing;
  },
  async reset(key: string): Promise<void> {
    await db.delete(key);
  },
};

const guard = new LLMGuard({ storage: myStorage, dailyBudgetTokens: 100_000 });
```

---

## Framework Integration

### Express.js

```typescript
import express from 'express';
import OpenAI from 'openai';
import { LLMGuard, expressMiddleware, budgetErrorHandler } from 'llm-spend-guard';

const app = express();
app.use(express.json());

const guard = new LLMGuard({
  dailyBudgetTokens: 500_000,
  userBudgetTokens: 50_000,
  maxTokensPerRequest: 10_000,
  onBudgetWarning(level, stats) {
    console.warn(`[${level}] ${stats.scopeKey}: ${stats.percentage.toFixed(1)}%`);
  },
});

const openai = new OpenAI();
guard.wrapOpenAI(openai);

// Middleware auto-extracts userId, sessionId, route from request
// userId from: x-user-id header or req.user.id (passport)
// sessionId from: x-session-id header or req.sessionID (express-session)
// route from: req.path
app.use(expressMiddleware(guard));

app.post('/api/chat', async (req, res, next) => {
  try {
    const response = await guard.openai.chat(
      {
        model: 'gpt-4o',
        messages: req.body.messages,
        max_tokens: 1000,
      },
      req.llmBudgetContext,  // Automatically populated by middleware
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Returns HTTP 429 with error details when budget exceeded
app.use(budgetErrorHandler);

app.listen(3000);
```

**When budget is exceeded, the client gets:**
```json
HTTP 429 Too Many Requests

{
  "error": "Token budget exceeded",
  "details": {
    "scope": "user",
    "scopeKey": "user:user-123",
    "used": 48500,
    "limit": 50000,
    "remaining": 1500,
    "percentage": 97.0
  }
}
```

### Next.js API Routes

```typescript
// pages/api/chat.ts (or app/api/chat/route.ts)
import OpenAI from 'openai';
import { LLMGuard, withBudgetGuard } from 'llm-spend-guard';

const guard = new LLMGuard({
  dailyBudgetTokens: 200_000,
  userBudgetTokens: 20_000,
  autoTruncate: true,
});

const openai = new OpenAI();
guard.wrapOpenAI(openai);

async function handler(req: any, res: any) {
  const response = await guard.openai.chat(
    {
      model: 'gpt-4o',
      messages: req.body.messages,
      max_tokens: 1000,
    },
    req.llmBudgetContext,  // Auto-populated by withBudgetGuard
  );
  res.status(200).json(response);
}

// Wraps handler with budget enforcement + auto 429 on exceeded
export default withBudgetGuard(guard, handler);
```

### Fastify / Koa / Hono

No built-in middleware for these, but integration is trivial since the guard is framework-agnostic:

```typescript
// Fastify example
fastify.post('/api/chat', async (request, reply) => {
  try {
    const response = await guard.openai.chat(
      {
        model: 'gpt-4o',
        messages: request.body.messages,
        max_tokens: 1000,
      },
      {
        userId: request.headers['x-user-id'] as string,
        sessionId: request.headers['x-session-id'] as string,
        route: request.url,
      },
    );
    return response;
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      reply.status(429).send({ error: 'Budget exceeded', details: err.stats });
      return;
    }
    throw err;
  }
});
```

---

## SaaS Per-User Budget Example

For multi-tenant SaaS apps where each user has their own token budget:

```typescript
import { LLMGuard, RedisStorage } from 'llm-spend-guard';
import Anthropic from '@anthropic-ai/sdk';
import Redis from 'ioredis';

const guard = new LLMGuard({
  userBudgetTokens: 10_000,          // 10K tokens per user per day
  dailyBudgetTokens: 1_000_000,      // 1M total across all users
  maxTokensPerRequest: 5_000,
  autoTruncate: true,
  storage: new RedisStorage(new Redis()),
  onBudgetWarning(level, stats) {
    if (stats.scope === 'user' && level === 'warning_80') {
      // Notify user they're running low
      notifyUser(stats.scopeKey.replace('user:', ''), {
        message: `You've used ${stats.percentage.toFixed(0)}% of your daily AI quota.`,
        remaining: stats.remaining,
      });
    }
  },
});

const anthropic = new Anthropic();
guard.wrapAnthropic(anthropic);

// In your API handler:
async function handleChat(userId: string, messages: any[]) {
  return guard.anthropic.chat(
    {
      model: 'claude-sonnet-4-20250514',
      messages,
      max_tokens: 1000,
    },
    { userId },
  );
}
```

---

## Full API Reference

### `LLMGuard`

| Method | Returns | Description |
|--------|---------|-------------|
| `new LLMGuard(config)` | `LLMGuard` | Create a guard instance |
| `wrapOpenAI(client)` | `OpenAIProvider` | Wrap an OpenAI SDK client |
| `wrapAnthropic(client)` | `AnthropicProvider` | Wrap an Anthropic SDK client |
| `wrapGemini(client)` | `GeminiProvider` | Wrap a Google Generative AI client |
| `guard.openai` | `OpenAIProvider` | Access the wrapped OpenAI provider |
| `guard.anthropic` | `AnthropicProvider` | Access the wrapped Anthropic provider |
| `guard.gemini` | `GeminiProvider` | Access the wrapped Gemini provider |
| `getStats(ctx?)` | `Promise<BudgetStats[]>` | Get usage stats for all applicable scopes |
| `getRemainingBudget(ctx?)` | `Promise<number>` | Get minimum remaining tokens across scopes |
| `reset(ctx?)` | `Promise<void>` | Reset usage counters |
| `getBudgetManager()` | `BudgetManager` | Access the underlying budget manager |

### Provider `.chat()` Method

All providers (OpenAI, Anthropic, Gemini) have the same interface:

```typescript
await guard.openai.chat(params, context?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `params.model` | `string` | Model name (e.g. `'gpt-4o'`, `'claude-sonnet-4-20250514'`) |
| `params.messages` | `ChatMessage[]` | Array of `{ role, content }` messages |
| `params.max_tokens` | `number` | Max output tokens (default: 4096) |
| `context.userId` | `string?` | User identifier for per-user budgets |
| `context.sessionId` | `string?` | Session identifier for per-session budgets |
| `context.route` | `string?` | Route/endpoint for per-route budgets |

### `BudgetStats` Object

```typescript
{
  scope: 'global' | 'user' | 'session' | 'route',
  scopeKey: string,     // e.g. "daily", "user:user-123"
  used: number,         // tokens consumed
  limit: number,        // budget cap
  remaining: number,    // tokens left
  percentage: number    // 0-100+
}
```

### `BudgetExceededError`

```typescript
err.message   // Human-readable error string
err.stats     // BudgetStats object with full details
err.name      // 'BudgetExceededError'
```

### Exports

```typescript
// Core
import { LLMGuard, BudgetManager, BudgetExceededError } from 'llm-spend-guard';

// Providers
import { OpenAIProvider, AnthropicProvider, GeminiProvider } from 'llm-spend-guard';

// Storage
import { MemoryStorage, RedisStorage } from 'llm-spend-guard';

// Middleware
import { expressMiddleware, budgetErrorHandler, withBudgetGuard } from 'llm-spend-guard';

// Utilities
import { estimateTokens, estimateMessagesTokens, truncateMessages } from 'llm-spend-guard';

// Types
import type {
  GuardConfig, BudgetConfig, BudgetStats, BudgetScope,
  AlertLevel, StorageAdapter, ScopeUsage, RequestContext,
  ChatMessage, TokenEstimatorFn,
} from 'llm-spend-guard';
```

---

## Running Tests

```bash
git clone <repo-url>
cd llm-spend-guard
npm install
npm test
```

**28 tests** covering:
- Budget overflow and enforcement
- Per-user, per-session, per-request limits
- Token estimation accuracy
- Context truncation logic
- Provider wrappers (mocked, no API keys needed)
- Alert callback firing
- Guard lifecycle (create, wrap, reset)

---

## Roadmap

- [ ] Dashboard UI integration (web panel to visualize usage)
- [ ] Cost estimation in USD (per-model pricing tables)
- [ ] Combined rate limiter + cost guard
- [ ] Analytics export (CSV, JSON)
- [ ] Streaming support with real-time token counting
- [ ] Webhook alerts (POST to URL on threshold)

---

## License

MIT
