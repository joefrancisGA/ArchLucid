#!/usr/bin/env bash
# Re-trigger invite-wave private-beta JwtBearer smoke on trunk when merge churn cancels runs.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

REF="${1:-master}"
WORKFLOW_FILE=".github/workflows/private-beta-access-on-push.yml"

if ! command -v gh >/dev/null 2>&1; then
  echo "retrigger_private_beta_access_on_push: gh CLI is required" >&2
  exit 1
fi

echo "Dispatching private-beta-access-on-push on ref ${REF}..."
gh workflow run private-beta-access-on-push.yml --ref "$REF"

echo "Queued. Inspect with: gh run list --workflow private-beta-access-on-push.yml --branch ${REF} --limit 3"
