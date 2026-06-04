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

# Per-test hang ceiling: a single deadlocked test must fail the shard quickly with a
# named culprit instead of silently consuming the whole job timeout (see DATA: 2026-06 fast-core 75m timeout).
HANG_TIMEOUT="${ARCHLUCID_FAST_CORE_HANG_TIMEOUT:-5m}"

# SDK 10+ MSBuild rejects multiple projects in one `dotnet test` invocation (MSB1008).
for proj in "${PROJECTS[@]}"; do
  echo "Fast core shard ${SHARD_ID}: testing ${proj} (blame-hang ${HANG_TIMEOUT})"
  ARGS=(
    dotnet test
    "${proj}"
    --no-build
    -c Release
    --filter "${DOTNET_FAST_CORE_TEST_FILTER}"
    --blame-hang
    --blame-hang-timeout "${HANG_TIMEOUT}"
    --blame-hang-dump-type none
  )

  if [ "${ARCHLUCID_FAST_CORE_COLLECT_COVERAGE:-0}" = "1" ]; then
    ARGS+=(
      --settings coverage.runsettings
      --collect:"XPlat Code Coverage"
      --results-directory "${RESULT_DIR}"
    )
  fi

  "${ARGS[@]}"
done
