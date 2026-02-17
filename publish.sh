#!/usr/bin/env bash
set -euo pipefail

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit and push before publish."
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
git fetch origin "$branch" >/dev/null 2>&1 || true
if [[ "$(git rev-parse "$branch")" != "$(git rev-parse "origin/$branch")" ]]; then
  echo "Local branch is not in sync with origin/$branch. Push before publish."
  exit 1
fi

npm run build
npm publish --access public
