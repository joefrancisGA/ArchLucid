#!/usr/bin/env bash
# Fail when ArchLucid_Unified_Schema.sql drifts from generator output (TB-066).
#
# Usage (repo root):
#   bash scripts/ci/check_archlucid_unified_schema_snapshot.sh
#
# Regenerate after ArchLucid.sql changes:
#   bash scripts/ci/update_archlucid_unified_schema_snapshot.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

python3 scripts/ci/check_archlucid_unified_schema_snapshot.py
