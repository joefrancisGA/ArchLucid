#!/usr/bin/env bash
# Dispatch full ci.yml regression matrix (workflow_dispatch) on trunk after push corset is green.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

REF="${1:-master}"
EXTENDED_LIVE_A11Y="${2:-false}"

if ! command -v gh >/dev/null 2>&1; then
  echo "dispatch_full_ci_matrix: gh CLI is required" >&2
  exit 1
fi

echo "Dispatching full CI matrix on ref ${REF} (run_extended_live_a11y_matrix=${EXTENDED_LIVE_A11Y})..."
gh workflow run ci.yml \
  --ref "$REF" \
  -f "run_extended_live_a11y_matrix=${EXTENDED_LIVE_A11Y}"

echo "Queued. Inspect with: gh run list --workflow ci.yml --branch ${REF} --limit 3"
