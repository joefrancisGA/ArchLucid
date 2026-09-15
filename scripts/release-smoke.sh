#!/usr/bin/env bash
# Linux/macOS wrapper for scripts/release-smoke.ps1 (Gate 1 witness).
# Requires PowerShell 7+ on PATH as `pwsh` — see docs/engineering/AGENTS.md.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec pwsh -NoProfile -File "$ROOT/scripts/release-smoke.ps1" "$@"
