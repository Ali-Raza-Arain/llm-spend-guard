# llm-spend-guard v2.0.1 — Open-source community health files & issue templates

## What's New
- GitHub issue templates (Bug Report, Feature Request, Question, Help Wanted) with structured YAML forms
- Pull Request template with checklist and type-of-change labels
- `CONTRIBUTING.md` — complete guide for contributors (setup, branch naming, commit convention, PR process)
- `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1
- `SECURITY.md` — private vulnerability reporting policy
- Roadmap documentation page

## Why Upgrade
This release focuses on making the project contributor-friendly. No code changes — all additions are community health files that improve the open-source experience.

## Install / Upgrade
```bash
npm install llm-spend-guard@2.0.1
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
