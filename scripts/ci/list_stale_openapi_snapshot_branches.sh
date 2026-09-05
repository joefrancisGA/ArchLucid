#!/usr/bin/env bash
# List remote branches created by openapi-snapshot-refresh when gh pr create is blocked.
# Usage: list_stale_openapi_snapshot_branches.sh [--json]
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI required" >&2
  exit 1
fi

if [ "${1:-}" = "--json" ]; then
  gh api repos/:owner/:repo/branches --paginate \
    -q '.[] | select(.name | startswith("chore/openapi-snapshot-")) | {name: .name, sha: .commit.sha}'
  exit 0
fi

echo "OpenAPI snapshot bot branches (merge or delete after trunk absorbs snapshot):"
gh api repos/:owner/:repo/branches --paginate \
  -q '.[] | select(.name | startswith("chore/openapi-snapshot-")) | .name' \
  | sort
