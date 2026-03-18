# Why llm-spend-guard?

## The Problem

A single runaway loop, an uncapped user session, or one oversized prompt can burn through your entire LLM budget in minutes. There is no built-in way to set spending limits across OpenAI, Anthropic, or Gemini SDKs.

## The Solution

**llm-spend-guard** wraps your existing LLM SDK calls and enforces token budgets *before* any request is sent to the API. If a request would exceed your budget, it gets blocked instantly — no money wasted.

## Key Benefits

- **Pre-request blocking** — Stops overspending *before* the API call, not after
- **Multi-provider** — Single API for OpenAI, Anthropic Claude, and Google Gemini
- **Multi-scope budgets** — Global, per-user, per-session, and per-route limits
- **Zero config** — Works with 3 lines of code, no infrastructure needed
- **Production-ready** — Redis storage, Express/Next.js middleware, TypeScript-first
- **Lightweight** — 18.6KB bundle, zero runtime dependencies beyond tiktoken

## How It Works

```
Your Code --> llm-spend-guard --> LLM API (OpenAI / Anthropic / Gemini)
                  |
                  |-- 1. Estimates tokens BEFORE the request
                  |-- 2. Checks all budget scopes (global, user, session, route)
                  |-- 3. If over budget --> BLOCKS the request
                  |-- 4. If auto-truncate enabled --> trims prompt to fit
                  |-- 5. Sends request to LLM API
                  |-- 6. Records actual token usage from response
                  |-- 7. Fires alert callbacks at 50%, 80%, 100% thresholds
```

## Who Is This For?

- **SaaS builders** who need per-user token limits
- **AI agent developers** who want to cap runaway chains
- **Backend teams** protecting production LLM endpoints
- **Solo developers** who want to avoid surprise bills
