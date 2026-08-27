#!/usr/bin/env bash
# Thin launcher for G-REAL-06 on Linux/macOS — requires PowerShell 7+ (pwsh).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v pwsh >/dev/null 2>&1; then
  echo "ERROR: pwsh (PowerShell 7+) is required. Install: https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-linux"
  exit 1
fi

PHASE="${1:-Interactive}"
shift || true

pwsh -NoProfile -File "$ROOT/scripts/Run-GReal06ProofRuns.ps1" -Phase "$PHASE" "$@"
