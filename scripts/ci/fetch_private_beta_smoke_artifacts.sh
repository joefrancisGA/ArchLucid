#!/usr/bin/env bash
# Download private-beta Playwright CI artifacts for triage.
# Usage:
#   bash scripts/ci/fetch_private_beta_smoke_artifacts.sh <run-id> [output-dir] [--lane smoke-branch|trunk|full-matrix]
set -euo pipefail

RUN_ID="${1:-}"
OUT_DIR="${2:-./private-beta-artifacts-${RUN_ID}}"
LANE="smoke-branch"

if [[ -z "${RUN_ID}" ]]; then
  echo "Usage: $0 <github-actions-run-id> [output-dir] [--lane smoke-branch|trunk|full-matrix]" >&2
  exit 2
fi

shift || true

if [[ $# -gt 0 && "${1}" != --* ]]; then
  OUT_DIR="$1"
  shift || true
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lane)
      LANE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

case "${LANE}" in
  smoke-branch)
    PREFIX="ui-e2e-live-beta-access-smoke-branch"
    ;;
  trunk)
    PREFIX="ui-e2e-live-beta-access-on-push"
    ;;
  full-matrix)
    PREFIX="ui-e2e-live-beta-access"
    ;;
  *)
    echo "Unsupported lane: ${LANE}" >&2
    exit 2
    ;;
esac

mkdir -p "${OUT_DIR}"

ARTIFACTS=(
  "${PREFIX}-api-log"
  "${PREFIX}-playwright-report"
  "${PREFIX}-test-results"
  "${PREFIX}-blob-report"
  "${PREFIX}-failure-triage"
)

echo "Fetching run ${RUN_ID} artifacts (lane=${LANE}) into ${OUT_DIR}..."

for name in "${ARTIFACTS[@]}"; do
  dest="${OUT_DIR}/${name}"
  mkdir -p "${dest}"

  if gh run download "${RUN_ID}" --name "${name}" --dir "${dest}" 2>/dev/null; then
    echo "  OK  ${name}"
  else
    echo "  skip ${name} (not present)"
    rmdir "${dest}" 2>/dev/null || true
  fi
done

python3 scripts/ci/report_private_beta_playwright_failure_triage.py \
  --lane "${LANE}" \
  --markdown-out "${OUT_DIR}/triage-checklist.md" \
  --json-out "${OUT_DIR}/triage-checklist.json"

echo "Triage checklist: ${OUT_DIR}/triage-checklist.md"
