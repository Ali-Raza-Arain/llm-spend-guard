# Express.js Middleware for LLM Token Budget Enforcement

Add token budget enforcement to any Express.js API with built-in middleware. Automatically extracts user/session context and returns HTTP 429 when budgets are exceeded.

## Setup

```bash
npm install llm-spend-guard openai express
```

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
```

## Add Middleware

```typescript
// Auto-extracts userId, sessionId, route from request
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

## What the Client Receives on Budget Exceeded

```json
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

The response status code is **429 Too Many Requests**.

## Context Extraction

The middleware automatically extracts:

| Field | Source |
|-------|--------|
| `userId` | `x-user-id` header or `req.user.id` (Passport.js) |
| `sessionId` | `x-session-id` header or `req.sessionID` (express-session) |
| `route` | `req.path` |
