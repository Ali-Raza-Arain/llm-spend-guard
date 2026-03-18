#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Release Script for llm-spend-guard
# Usage: ./scripts/release.sh [patch|minor|major]
# Default: patch
# ============================================================

BUMP="${1:-patch}"

echo "==> Running tests..."
npm test

echo "==> Running lint..."
npm run lint

echo "==> Bumping version ($BUMP)..."
NEW_VERSION=$(npm version "$BUMP" --no-git-tag-version | tr -d 'v')
echo "    New version: $NEW_VERSION"

echo "==> Building..."
npm run build

echo "==> Publishing to npm..."
npm publish

echo "==> Staging changes..."
git add package.json package-lock.json

echo "==> Committing..."
git commit -m "$NEW_VERSION"

echo "==> Creating annotated tag..."
git tag -a "v$NEW_VERSION" -m "v$NEW_VERSION"

echo "==> Pushing commit + tag..."
git push origin main --follow-tags

echo "==> Creating GitHub Release..."
gh release create "v$NEW_VERSION" \
  --title "v$NEW_VERSION" \
  --generate-notes

echo ""
echo "============================================"
echo "  Released v$NEW_VERSION successfully!"
echo "============================================"
echo ""
echo "Post-release checklist:"
echo "  1. Update CHANGELOG.md with release details"
echo "  2. Share on Dev.to / Reddit / X (see .github/SOCIAL_POSTS.md)"
echo "  3. Update GitHub repo 'About' description if needed"
echo ""
