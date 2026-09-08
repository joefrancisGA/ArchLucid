#!/usr/bin/env bash
# Re-trigger isolated private-beta smoke on the merge-safe lane branch.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

REF="${1:-cursor/al-beta-private-beta-frozen-7730}"
WORKFLOW_FILE=".github/workflows/private-beta-access-smoke-branch.yml"

if ! command -v gh >/dev/null 2>&1; then
  echo "retrigger_private_beta_smoke_branch: gh CLI is required" >&2
  exit 1
fi

echo "Dispatching private-beta-access-smoke-branch on ref ${REF}..."
gh workflow run private-beta-access-smoke-branch.yml --ref "$REF"

echo "Queued. Inspect with: gh run list --workflow private-beta-access-smoke-branch.yml --branch ${REF} --limit 3"
