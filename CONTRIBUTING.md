# Contributing to llm-spend-guard

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Fork and clone the repo
git clone https://github.com/<your-username>/llm-spend-guard.git
cd llm-spend-guard

# Install dependencies
npm install

# Run tests to verify setup
npm test

# Build the project
npm run build

# Type check
npm run lint
```

## How to Contribute

### Reporting Bugs

Use the [Bug Report](https://github.com/ali-raza-arain/llm-spend-guard/issues/new?template=bug_report.yml) template. Include:

- Package version and Node.js version
- Which LLM provider is affected
- Steps to reproduce
- Expected vs actual behavior

### Suggesting Features

Use the [Feature Request](https://github.com/ali-raza-arain/llm-spend-guard/issues/new?template=feature_request.yml) template. Describe the problem you're solving and your proposed solution.

### Submitting Code

1. **Check existing issues** - Look for open issues or create one before starting work.
2. **Fork the repo** and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   # or
   git checkout -b fix/your-bugfix
   ```
3. **Write your code** following the guidelines below.
4. **Write or update tests** for your changes.
5. **Run checks** before committing:
   ```bash
   npm run lint    # Type checking
   npm test        # Run tests
   npm run build   # Ensure it builds
   ```
6. **Commit** with a clear message (see [Commit Convention](#commit-convention)).
7. **Push** and open a Pull Request.

## Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/short-description` | `feat/add-cohere-provider` |
| Bug fix | `fix/short-description` | `fix/budget-overflow` |
| Docs | `docs/short-description` | `docs/update-api-guide` |
| Refactor | `refactor/short-description` | `refactor/simplify-tracker` |

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for Cohere provider
fix: correct token counting for streaming responses
docs: update configuration examples
test: add tests for budget reset
refactor: simplify cost calculation logic
chore: update dependencies
```

## Code Guidelines

- **TypeScript** - All source code is in TypeScript. Maintain strict typing.
- **Tests** - Write tests using Jest. Aim for coverage on new code.
- **No breaking changes** without discussion - Open an issue first if your change affects the public API.
- **Keep it focused** - One PR should address one concern. Don't mix features with refactors.
- **Document public APIs** - Add JSDoc comments for exported functions and types.

## Project Structure

```
src/            # Source code (TypeScript)
dist/           # Build output (do not edit)
docs/           # VitePress documentation site
tests/          # Test files
```

## Pull Request Process

1. Fill out the PR template completely.
2. Ensure all checks pass (tests, types, build).
3. Link the related issue (e.g., `Closes #12`).
4. Request a review from a maintainer.
5. Address review feedback with new commits (don't force-push).
6. A maintainer will merge once approved.

## First-Time Contributors

Look for issues labeled [`good first issue`](https://github.com/ali-raza-arain/llm-spend-guard/labels/good%20first%20issue). These are beginner-friendly tasks to help you get familiar with the codebase.

## Code of Conduct

By contributing, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and constructive.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Questions?

Open a [Question](https://github.com/ali-raza-arain/llm-spend-guard/issues/new?template=question.yml) issue or start a discussion. We're happy to help!
