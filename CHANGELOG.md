# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
