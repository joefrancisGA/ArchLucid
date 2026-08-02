#!/usr/bin/env bash
# Run one fast-core corset shard (Suite=Core subset) after a full-solution Release build.
# Usage: bash scripts/ci/run_fast_core_corset_shard.sh <shard_id>
# Env: DOTNET_FAST_CORE_TEST_FILTER (required); ARCHLUCID_FAST_CORE_COLLECT_COVERAGE=1 for coverlet.
#
# Hang diagnostics (written under RUNNER_TEMP/coverage-fast-core):
#   current-project.txt  — project under test when the job/step is killed
#   project-timing.log   — UTC START/END/HUNG lines with durations (survives partial runs)
#   *.trx / Sequence_*.xml — per-project TRX + blame-hang sequence (when emitted)
#
# A wedged project is killed here (see PROJECT_TIMEOUT) rather than by the step or job timeout, so the
# culprit is named in the step log even when the artifact upload never gets to run.

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

MARKER="${RESULT_DIR}/current-project.txt"
TIMING_LOG="${RESULT_DIR}/project-timing.log"
: >"$TIMING_LOG"

echo "Fast core shard ${SHARD_ID}: ${#PROJECTS[@]} project(s)"
echo "Diagnostics: ${RESULT_DIR} (current-project.txt, project-timing.log, *.trx)"

# Per-test hang ceiling: a single deadlocked test must fail the shard quickly with a
# named culprit instead of silently consuming the whole job timeout (see DATA: 2026-06 fast-core 75m timeout).
HANG_TIMEOUT="${ARCHLUCID_FAST_CORE_HANG_TIMEOUT:-5m}"

# Per-project wall-clock ceiling. blame-hang only covers a single test that stops reporting; it does not
# cover a wedged test host or a coverage-collector stall at session end, which is how surface-misc burned
# its entire job budget in runs 30712614069 and 30729657151 (same commit passed in 24m on a retry).
# Killing the project from bash keeps the loop alive, so END/HUNG lines and the ::error:: reach the log.
# Slowest project observed is ~5.5m (ArchLucid.Architecture.Tests), so 9m leaves ~1.6x headroom.
PROJECT_TIMEOUT="${ARCHLUCID_FAST_CORE_PROJECT_TIMEOUT:-9m}"

# SDK 10+ MSBuild rejects multiple projects in one `dotnet test` invocation (MSB1008).
for proj in "${PROJECTS[@]}"; do
  proj_base="$(basename "${proj}" .csproj)"
  utc_start="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  start_epoch="$(date +%s)"

  # Marker is the primary signal when the step/job is hard-killed (timeout): upload-artifact
  # can still pick this up via if: always() after a step-level timeout.
  printf '%s\n' "${proj}" >"${MARKER}"

  echo "::group::Fast core shard ${SHARD_ID}: ${proj} (blame-hang ${HANG_TIMEOUT}, cap ${PROJECT_TIMEOUT})"
  echo "${utc_start} START ${proj}" | tee -a "${TIMING_LOG}"

  ARGS=(
    timeout --kill-after=30s "${PROJECT_TIMEOUT}"
    dotnet test
    "${proj}"
    --no-build
    -c Release
    --filter "${DOTNET_FAST_CORE_TEST_FILTER}"
    --blame-hang
    --blame-hang-timeout "${HANG_TIMEOUT}"
    --blame-hang-dump-type none
    --logger "trx;LogFilePrefix=${proj_base}-"
    --results-directory "${RESULT_DIR}"
  )

  if [ "${ARCHLUCID_FAST_CORE_COLLECT_COVERAGE:-0}" = "1" ]; then
    ARGS+=(
      --settings coverage.runsettings
      --collect:"XPlat Code Coverage"
    )
  fi

  set +e
  "${ARGS[@]}"
  exit_code=$?
  set -e

  end_epoch="$(date +%s)"
  utc_end="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  duration_sec=$((end_epoch - start_epoch))

  echo "${utc_end} END ${proj} exit=${exit_code} duration_sec=${duration_sec}" | tee -a "${TIMING_LOG}"
  echo "::notice::Fast core ${SHARD_ID} / ${proj_base}: ${duration_sec}s (exit ${exit_code})"
  echo "::endgroup::"

  # `timeout` reports 124 after SIGTERM and 137 (128+9) once --kill-after escalates to SIGKILL.
  if [ "${exit_code}" -eq 124 ] || [ "${exit_code}" -eq 137 ]; then
    printf 'HUNG %s (no completion within %s)\n' "${proj}" "${PROJECT_TIMEOUT}" >"${MARKER}"
    echo "${utc_end} HUNG ${proj} exceeded ${PROJECT_TIMEOUT}" | tee -a "${TIMING_LOG}"
    echo "::error::Fast core shard ${SHARD_ID} HUNG on ${proj}: killed after ${PROJECT_TIMEOUT}. Blame-hang ${HANG_TIMEOUT} did not fire, so the stall is outside any single test — suspect a wedged test host or coverage collection at session end."

    # `timeout` signals only its direct child, so test hosts can outlive it and skew the rest of the shard.
    pkill -f testhost >/dev/null 2>&1 || true
    pkill -f vstest.console >/dev/null 2>&1 || true
    exit 1
  fi

  if [ "${exit_code}" -ne 0 ]; then
    echo "::error::Fast core shard ${SHARD_ID} failed on ${proj} after ${duration_sec}s (exit ${exit_code}). See project-timing.log and TRX under ${RESULT_DIR}."
    exit "${exit_code}"
  fi

  printf '(idle — last finished: %s)\n' "${proj}" >"${MARKER}"
done

echo "Fast core shard ${SHARD_ID}: all ${#PROJECTS[@]} project(s) passed."
echo "(shard complete)" >"${MARKER}"
