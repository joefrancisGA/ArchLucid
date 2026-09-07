#!/usr/bin/env bash
# Run one Operator UI Vitest shard (see scripts/ci/ui_unit_vitest_shards.json).
# Usage: bash scripts/ci/run_ui_unit_vitest_shard.sh <shard_id>
# Prerequisite: npm ci in archlucid-ui (caller runs install).

set -euo pipefail

SHARD_ID="${1:?shard id required (lib | components | app-operator-a | app-operator-b | app-operator-c | app-operator-d | app-operator-e | app-marketing | surface)}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MANIFEST="${ROOT}/scripts/ci/ui_unit_vitest_shards.json"
UI_DIR="${ROOT}/archlucid-ui"

if [ ! -f "${MANIFEST}" ]; then
  echo "::error::Missing shard manifest ${MANIFEST}"
  exit 1
fi

mapfile -t PATHS < <(python3 -c "
import json
import sys

shard_id = sys.argv[1]
manifest_path = sys.argv[2]
with open(manifest_path, encoding='utf-8') as handle:
    shards = json.load(handle)['shards']
for shard in shards:
    if shard['id'] == shard_id:
        print('\n'.join(shard['paths']))
        break
else:
    raise SystemExit(f'Unknown shard id: {shard_id}')
" "${SHARD_ID}" "${MANIFEST}")

if [ "${#PATHS[@]}" -eq 0 ]; then
  echo "::error::No Vitest paths resolved for shard ${SHARD_ID}"
  exit 1
fi

cd "${UI_DIR}"
echo "UI unit Vitest shard ${SHARD_ID}: ${#PATHS[@]} path glob(s)"

# OperatorHomePageView.test.tsx alone OOMs under the default 6 GiB CI heap (app-operator-e).
# app-operator-d includes heavy operate-authority + render-gate shards; raise heap to match operator-e.
# GitHub-hosted linux runners have ~16 GiB RAM; 8 GiB still OOM'd on RC13 — use 12 GiB for these shards only.
if [ "${SHARD_ID}" = "app-operator-e" ] || [ "${SHARD_ID}" = "app-operator-d" ]; then
  export NODE_OPTIONS="--max-old-space-size=12288"
  echo "Raised NODE_OPTIONS=${NODE_OPTIONS} for heavy Operator UI shard ${SHARD_ID}"
fi

npm run test:vitest-single-worker -- "${PATHS[@]}"
