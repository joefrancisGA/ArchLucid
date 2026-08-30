#!/usr/bin/env bash
# Export Azure OpenAI env vars for live real-mode CI (endpoint, key, deployment).
# Prefers explicit CI secrets; falls back to budget.config.json deploymentName.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

_resolve_deployment() {
  if [ -n "${ARCHLUCID_CI_REAL_AOAI_DEPLOYMENT:-}" ]; then
    echo "${ARCHLUCID_CI_REAL_AOAI_DEPLOYMENT}"
    return
  fi

  if [ -n "${ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT:-}" ]; then
    echo "${ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT}"
    return
  fi

  if [ -n "${AZURE_OPENAI_DEPLOYMENT_NAME:-}" ]; then
    echo "${AZURE_OPENAI_DEPLOYMENT_NAME}"
    return
  fi

  python3 "${SCRIPT_DIR}/read_golden_cohort_deployment_name.py"
}

_resolve_endpoint() {
  if [ -n "${ARCHLUCID_CI_REAL_AOAI_ENDPOINT:-}" ]; then
    echo "${ARCHLUCID_CI_REAL_AOAI_ENDPOINT}"
    return
  fi

  if [ -n "${ARCHLUCID_REAL_AOAI_TEST_ENDPOINT:-}" ]; then
    echo "${ARCHLUCID_REAL_AOAI_TEST_ENDPOINT}"
    return
  fi

  if [ -n "${AZURE_OPENAI_ENDPOINT:-}" ]; then
    echo "${AZURE_OPENAI_ENDPOINT}"
    return
  fi

  echo ""
}

_resolve_key() {
  if [ -n "${ARCHLUCID_CI_REAL_AOAI_KEY:-}" ]; then
    echo "${ARCHLUCID_CI_REAL_AOAI_KEY}"
    return
  fi

  if [ -n "${ARCHLUCID_REAL_AOAI_TEST_KEY:-}" ]; then
    echo "${ARCHLUCID_REAL_AOAI_TEST_KEY}"
    return
  fi

  if [ -n "${AZURE_OPENAI_API_KEY:-}" ]; then
    echo "${AZURE_OPENAI_API_KEY}"
    return
  fi

  echo ""
}

DEPLOYMENT="$(_resolve_deployment)"
ENDPOINT="$(_resolve_endpoint)"
API_KEY="$(_resolve_key)"

export AZURE_OPENAI_DEPLOYMENT_NAME="${DEPLOYMENT}"
export ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT="${DEPLOYMENT}"

if [ -n "${ENDPOINT}" ]; then
  export AZURE_OPENAI_ENDPOINT="${ENDPOINT}"
  export ARCHLUCID_REAL_AOAI_TEST_ENDPOINT="${ENDPOINT}"
fi

if [ -n "${API_KEY}" ]; then
  export AZURE_OPENAI_API_KEY="${API_KEY}"
  export ARCHLUCID_REAL_AOAI_TEST_KEY="${API_KEY}"
fi

echo "real_mode_aoai_deployment=${DEPLOYMENT}" >&2

if [ -z "${ENDPOINT}" ] || [ -z "${API_KEY}" ]; then
  echo "::notice::Live real-mode AOAI credentials not fully configured in this job context (endpoint or key empty)."
fi
