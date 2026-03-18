# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-03-18

### Added
- VitePress documentation site with 8 SEO-targeted pages (deployed on GitHub Pages)
- Schema.org `SoftwareApplication` structured data markup
- Open Graph and Twitter Card meta tags for social sharing
- Auto-generated `sitemap.xml` for search engine crawling
- GitHub Pages deployment workflow (`.github/workflows/deploy-docs.yml`)
- Release automation script (`scripts/release.sh`) — single command for test, build, publish, tag, and release
- Dev.to article draft (`.github/DEVTO_ARTICLE.md`)
- Social post templates for Reddit, Hacker News, and X (`.github/SOCIAL_POSTS.md`)
- "Why llm-spend-guard?" section in README
- "Comparison with Alternatives" table in README
- `CHANGELOG.md` following Keep a Changelog format
- GitHub Release notes template (`.github/RELEASE_TEMPLATE.md`)

### Changed
- Optimized `package.json` description for Google search snippets (127 characters)
- Added 8 new SEO keywords (`token-budget`, `llm-cost`, `api-cost-control`, `spending-limit`, `token-limit`, `ai-cost-management`, `gpt-4`, `gpt-4o`)
- Added `repository`, `homepage`, `bugs`, and `author` fields to `package.json`
- Updated `homepage` to point to docs site

## [1.0.4] - 2025-03-10

### Changed
- Updated README version badge to use NPM
- Removed duplicate badge

## [1.0.3] - 2025-03-10

### Changed
- Improved README documentation

## [1.0.2] - 2025-03-10

### Added
- GitHub Actions CI workflow (lint, test, build)

### Changed
- Updated package configuration

## [1.0.0] - 2025-03-10

### Added
- Initial release
- Token budget enforcement for OpenAI, Anthropic Claude, and Google Gemini
- Per-user, per-session, per-route budget scopes
- Global and daily budget limits
- Express.js middleware (`expressMiddleware`, `budgetErrorHandler`)
- Next.js API route wrapper (`withBudgetGuard`)
- In-memory and Redis storage backends
- Custom storage adapter interface
- Auto-truncation of oversized prompts
- Alert callbacks at 50%, 80%, 100% thresholds
- `BudgetExceededError` with detailed stats
- TypeScript-first with full type exports
