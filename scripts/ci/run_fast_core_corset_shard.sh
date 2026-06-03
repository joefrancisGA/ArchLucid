#!/usr/bin/env bash
# Run one fast-core corset shard (Suite=Core subset) after a full-solution Release build.
# Usage: bash scripts/ci/run_fast_core_corset_shard.sh <shard_id>
# Env: DOTNET_FAST_CORE_TEST_FILTER (required); ARCHLUCID_FAST_CORE_COLLECT_COVERAGE=1 for coverlet.

set -euo pipefail

SHARD_ID="${1:?shard id required (api | host-application | data-core | surface-misc)}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [ -z "${DOTNET_FAST_CORE_TEST_FILTER:-}" ]; then
  echo "::error::DOTNET_FAST_CORE_TEST_FILTER is not set"
  exit 1
fi

mapfile -t PROJECTS < <(python3 -c "
import json
import sys

shard_id = sys.argv[1]
with open('scripts/ci/fast_core_corset_shards.json', encoding='utf-8') as handle:
    shards = json.load(handle)['shards']
for shard in shards:
    if shard['id'] == shard_id:
        print('\n'.join(shard['projects']))
        break
else:
    raise SystemExit(f'Unknown shard id: {shard_id}')
" "$SHARD_ID")

if [ "${#PROJECTS[@]}" -eq 0 ]; then
  echo "::error::No projects resolved for shard ${SHARD_ID}"
  exit 1
fi

RESULT_DIR="${RUNNER_TEMP:-/tmp}/coverage-fast-core"
mkdir -p "$RESULT_DIR"

echo "Fast core shard ${SHARD_ID}: ${#PROJECTS[@]} project(s)"

ARGS=(
  dotnet test
  "${PROJECTS[@]}"
  --no-build
  -c Release
  --filter "${DOTNET_FAST_CORE_TEST_FILTER}"
)

if [ "${ARCHLUCID_FAST_CORE_COLLECT_COVERAGE:-0}" = "1" ]; then
  ARGS+=(
    --settings coverage.runsettings
    --collect:"XPlat Code Coverage"
    --results-directory "${RESULT_DIR}"
  )
fi

"${ARGS[@]}"
