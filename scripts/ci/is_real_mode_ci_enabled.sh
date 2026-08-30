#!/usr/bin/env bash
# Return 0 when real-mode CI paths should run (committed marker or repository variable).
#
# Usage:
#   bash scripts/ci/is_real_mode_ci_enabled.sh              # enabled check
#   bash scripts/ci/is_real_mode_ci_enabled.sh live-schedule # weekly live drift
#   bash scripts/ci/is_real_mode_ci_enabled.sh main-ci-live  # workflow_dispatch live invoke
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MODE="${1:-enabled}"

_is_truthy() {
  case "${1:-}" in
    true | TRUE | 1 | yes | YES) return 0 ;;
    *) return 1 ;;
  esac
}

_real_mode_enabled() {
  if [ -f "${REPO_ROOT}/.github/REAL_MODE_CI_ENABLED" ]; then
    return 0
  fi

  if _is_truthy "${ARCHLUCID_GOLDEN_COHORT_REAL_LLM:-}"; then
    return 0
  fi

  return 1
}

_live_schedule_enabled() {
  if ! _real_mode_enabled; then
    return 1
  fi

  if [ -n "${ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED:-}" ] && ! _is_truthy "${ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED}"; then
    return 1
  fi

  if [ -f "${REPO_ROOT}/.github/REAL_MODE_CI_LIVE_SCHEDULE_ENABLED" ]; then
    return 0
  fi

  if _is_truthy "${ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED:-}"; then
    return 0
  fi

  return 1
}

_main_ci_live_enabled() {
  if ! _real_mode_enabled; then
    return 1
  fi

  if [ "${GITHUB_EVENT_NAME:-}" != "workflow_dispatch" ]; then
    return 1
  fi

  return 0
}

case "${MODE}" in
  enabled)
    _real_mode_enabled
    ;;
  live-schedule)
    _live_schedule_enabled
    ;;
  main-ci-live)
    _main_ci_live_enabled
    ;;
  *)
    echo "Unknown mode: ${MODE}" >&2
    exit 2
    ;;
esac
