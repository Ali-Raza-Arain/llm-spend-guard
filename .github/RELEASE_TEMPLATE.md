# llm-spend-guard v1.0.4 — SEO-optimized package.json, README improvements, and CHANGELOG

## What's New
- Added `repository`, `homepage`, `bugs`, and `author` fields to `package.json` for npm-to-GitHub backlinks
- Added 8 new SEO-targeted keywords (`token-budget`, `llm-cost`, `api-cost-control`, `spending-limit`, `token-limit`, `ai-cost-management`, `gpt-4`, `gpt-4o`)
- Optimized package description for Google search snippets (127 characters)
- Added "Why llm-spend-guard?" section to README with feature highlights
- Added "Comparison with Alternatives" table to README
- Created `CHANGELOG.md` following Keep a Changelog format
- Created `.github/RELEASE_TEMPLATE.md` for consistent, SEO-friendly release notes

## Why Upgrade
Improved discoverability on npm search and Google. The package now has proper metadata linking npm to GitHub, keyword-rich descriptions, and structured content that search engines can index effectively.

## Install / Upgrade
```bash
npm install llm-spend-guard@1.0.4
```

## Quick Example
```typescript
import { LLMGuard } from 'llm-spend-guard';
import OpenAI from 'openai';

const guard = new LLMGuard({ dailyBudgetTokens: 100_000 });
const openai = new OpenAI();
guard.wrapOpenAI(openai);

const response = await guard.openai.chat({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 500,
});
```

## Full Changelog
See [CHANGELOG.md](https://github.com/Ali-Raza-Arain/llm-spend-guard/blob/main/CHANGELOG.md)
