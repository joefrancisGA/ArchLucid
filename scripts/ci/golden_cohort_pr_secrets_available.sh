#!/usr/bin/env bash
# Return 0 when cohort-real-llm-gate may call azure/login; 1 for a secretless no-op.
#
# Usage:
#   bash scripts/ci/golden_cohort_pr_secrets_available.sh
#
# Environment:
#   GITHUB_ACTOR, GITHUB_EVENT_NAME, GITHUB_REPOSITORY  (Actions defaults)
#   PR_HEAD_REPO_FULL_NAME  (github.event.pull_request.head.repo.full_name)
#   AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID
#
# Dependabot and fork pull_request runs do not receive GitHub Environment OIDC
# secrets (dev AZURE_CLIENT_ID / TENANT_ID / SUBSCRIPTION_ID). azure/login then
# fails with missing client-id/tenant-id and blocks merge because
# cohort-real-llm-gate is a required status check. Same-repo human PRs and
# schedule/workflow_dispatch still attempt login so a missing secret stays red.
set -euo pipefail

_is_dependabot_actor() {
  [ "${GITHUB_ACTOR:-}" = "dependabot[bot]" ]
}

_is_pull_request() {
  [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ]
}

_is_fork_pull_request() {
  if ! _is_pull_request; then
    return 1
  fi

  [ "${PR_HEAD_REPO_FULL_NAME:-}" != "${GITHUB_REPOSITORY:-}" ]
}

_azure_oidc_secrets_present() {
  [ -n "${AZURE_CLIENT_ID:-}" ] && [ -n "${AZURE_TENANT_ID:-}" ] && [ -n "${AZURE_SUBSCRIPTION_ID:-}" ]
}

if _is_dependabot_actor; then
  echo "Dependabot pull request; cohort-real-llm-gate passes as no-op (secrets unavailable)."
  exit 1
fi

if _is_fork_pull_request; then
  echo "Fork pull request; cohort-real-llm-gate passes as no-op (secrets unavailable)."
  exit 1
fi

if _is_pull_request && ! _azure_oidc_secrets_present; then
  echo "Azure OIDC secrets are empty; cohort-real-llm-gate passes as no-op (Azure credentials unavailable)."
  exit 1
fi

exit 0
