#!/usr/bin/env bash
# Regenerate ArchLucid_Unified_Schema.sql from ArchLucid.sql (TB-066).
#
# Usage (repo root):
#   bash scripts/ci/update_archlucid_unified_schema_snapshot.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

python3 scripts/ci/build_archlucid_unified_schema_sql.py
python3 scripts/ci/check_archlucid_unified_schema_snapshot.py
