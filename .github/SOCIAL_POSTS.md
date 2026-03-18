# Social Posts for llm-spend-guard

## Reddit r/node and r/javascript

**Title:** I built a token budget guard for OpenAI, Anthropic Claude, and Gemini APIs — 3 lines to stop overspending

**Body:**

I got tired of worrying about runaway LLM API costs, so I built `llm-spend-guard` — a lightweight npm package that enforces token budgets *before* requests are sent.

**The problem:** There's no built-in way to set spending limits across OpenAI, Anthropic, or Gemini SDKs. One runaway loop = your entire budget gone.

**The solution:** Wrap your existing SDK client, set a budget, and every request gets checked before it leaves your server.

```typescript
const guard = new LLMGuard({ dailyBudgetTokens: 100_000 });
guard.wrapOpenAI(openai);

// This throws BudgetExceededError if over budget — API never called
await guard.openai.chat({ model: 'gpt-4o', messages, max_tokens: 500 });
```

Features:
- Pre-request blocking (no money wasted)
- OpenAI + Claude + Gemini support
- Per-user, per-session, per-route budgets
- Redis storage for production
- Express/Next.js middleware
- Auto-truncation of oversized prompts
- 18.6KB, TypeScript-first

Links:
- npm: https://www.npmjs.com/package/llm-spend-guard
- GitHub: https://github.com/Ali-Raza-Arain/llm-spend-guard
- Docs: https://ali-raza-arain.github.io/llm-spend-guard/

Would love feedback!

---

## Hacker News (Show HN)

**Title:** Show HN: llm-spend-guard – Real-time token budgets for OpenAI, Claude, and Gemini APIs

**Body:**

I built a Node.js package that enforces token budgets before LLM API requests are sent. If a request would exceed your budget, it gets blocked locally — the API is never called.

Works with OpenAI, Anthropic Claude, and Google Gemini. Supports per-user, per-session, and per-route budgets. Production-ready with Redis storage and Express/Next.js middleware.

npm: https://www.npmjs.com/package/llm-spend-guard
GitHub: https://github.com/Ali-Raza-Arain/llm-spend-guard

---

## X/Twitter Thread

**Tweet 1:**
Your LLM API bill is a ticking time bomb.

One runaway loop. One uncapped user. One oversized prompt.

That's all it takes to burn through your entire budget in minutes.

I built a 3-line fix. Thread

**Tweet 2:**
llm-spend-guard wraps your existing OpenAI/Claude/Gemini SDK and enforces token budgets BEFORE requests are sent.

Over budget? Request blocked. API never called. No money wasted.

```
npm install llm-spend-guard
```

**Tweet 3:**
It supports:
→ Per-user budgets (perfect for SaaS)
→ Per-session limits
→ Per-route controls
→ Auto-truncation of long prompts
→ Redis for production
→ Express/Next.js middleware

All in 18.6KB.

**Tweet 4:**
Try it:

npm: https://npmjs.com/package/llm-spend-guard
GitHub: https://github.com/Ali-Raza-Arain/llm-spend-guard
Docs: https://ali-raza-arain.github.io/llm-spend-guard/

If you've been bitten by surprise LLM bills, this is for you.

---

## StackOverflow — Target Questions

Search for these questions and answer them mentioning llm-spend-guard where genuinely helpful:

1. "How to limit OpenAI API token usage in Node.js"
2. "OpenAI API spending limit programmatically"
3. "Rate limit LLM API calls per user"
4. "How to set budget for GPT-4 API calls"
5. "Anthropic Claude API cost control"
6. "Prevent OpenAI API overspending in production"
