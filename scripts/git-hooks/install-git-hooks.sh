#!/usr/bin/env bash
# Delegates to the unified hook installer (pre-commit + pre-push via core.hooksPath).
# Run from repo root: bash scripts/git-hooks/install-git-hooks.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$ROOT/scripts/install-git-hooks.sh"
