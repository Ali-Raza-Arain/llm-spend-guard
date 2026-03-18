# Comparison with Alternatives

How does **llm-spend-guard** compare to other approaches for controlling LLM API costs?

## Feature Comparison

| Feature | llm-spend-guard | Manual tracking | OpenAI Usage Limits |
|---------|----------------|-----------------|---------------------|
| Pre-request blocking | Yes | No | No (post-hoc only) |
| Multi-provider support | OpenAI + Claude + Gemini | Manual per SDK | OpenAI only |
| Per-user budgets | Built-in | Build yourself | No |
| Per-session / per-route scopes | Built-in | Build yourself | No |
| Auto-truncation | Yes | No | No |
| Express/Next.js middleware | Built-in | Build yourself | No |
| Redis support | Built-in | Build yourself | No |
| Self-hosted | Yes | Yes | No (vendor dashboard) |

## vs. Manual Token Tracking

Building your own token counter means:
- Writing provider-specific token estimation for each SDK
- Managing storage (in-memory, Redis, database)
- Building scope logic (per-user, per-session)
- Handling edge cases (midnight resets, concurrent requests)
- Maintaining it as SDKs change

**llm-spend-guard** handles all of this in a single `npm install`.

## vs. OpenAI Usage Limits

OpenAI's built-in usage limits:
- Only work for OpenAI (not Claude or Gemini)
- Are configured in the dashboard, not in code
- Cannot enforce per-user or per-session limits
- Only alert *after* money is spent, not *before*

## vs. Rate Limiting Libraries

Rate limiters (express-rate-limit, etc.) limit **requests per time window**. They don't understand tokens. A single request with a 100K token prompt passes through a rate limiter but could cost $10+.

**llm-spend-guard** limits **tokens**, which directly maps to cost.
