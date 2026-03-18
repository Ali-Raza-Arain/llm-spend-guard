# API Reference

## LLMGuard

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

## Provider `.chat()` Method

All providers (OpenAI, Anthropic, Gemini) share the same interface:

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

## BudgetStats Object

```typescript
{
  scope: 'global' | 'user' | 'session' | 'route',
  scopeKey: string,
  used: number,
  limit: number,
  remaining: number,
  percentage: number
}
```

## BudgetExceededError

```typescript
err.message   // Human-readable error string
err.stats     // BudgetStats object with full details
err.name      // 'BudgetExceededError'
```

## Exports

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
