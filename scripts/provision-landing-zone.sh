#!/usr/bin/env bash
# Thin wrapper around infra/apply-saas.ps1 hosted 3-wave path.
# Requires pwsh. Usage:
#   ./scripts/provision-landing-zone.sh
#   ./scripts/provision-landing-zone.sh --dry-run
#   ./scripts/provision-landing-zone.sh --plan
#   ./scripts/provision-landing-zone.sh --apply
#   ./scripts/provision-landing-zone.sh --var-file path.tfvars

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPLY_SAAS="$REPO_ROOT/infra/apply-saas.ps1"

if ! command -v pwsh >/dev/null 2>&1; then
  echo "pwsh is required to run infra/apply-saas.ps1" >&2
  exit 1
fi

if [[ ! -f "$APPLY_SAAS" ]]; then
  echo "Missing apply-saas.ps1 at $APPLY_SAAS" >&2
  exit 1
fi

DRY_RUN=0
PLAN=0
APPLY=0
VALIDATE_ONLY=0
VAR_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --validate-only) VALIDATE_ONLY=1; shift ;;
    --plan) PLAN=1; shift ;;
    --apply) APPLY=1; shift ;;
    --var-file)
      VAR_FILE="${2:-}"
      if [[ -z "$VAR_FILE" ]]; then
        echo "--var-file requires a path" >&2
        exit 2
      fi
      shift 2
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ "$APPLY" -eq 1 && "$VALIDATE_ONLY" -eq 1 ]]; then
  echo "Cannot combine --apply with --validate-only." >&2
  exit 1
fi

ARGS=(-File "$APPLY_SAAS" -MultiRoot)

if [[ "$DRY_RUN" -eq 1 ]]; then
  ARGS+=(-DryRun)
fi

if [[ "$APPLY" -eq 1 ]]; then
  ARGS+=(-Apply)
elif [[ "$PLAN" -eq 1 ]]; then
  :
else
  ARGS+=(-ValidateOnly)
fi

if [[ -n "$VAR_FILE" ]]; then
  ARGS+=(-VarFile "$VAR_FILE")
fi

exec pwsh "${ARGS[@]}"
