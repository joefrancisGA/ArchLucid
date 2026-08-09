#!/usr/bin/env bash
# TB-946 — single-signal scale micro-drills (A HTTP/LLM-wait, B CPU-bound, C worker backlog).
# Measurement-first: thresholds are warn-only; owner records replica + dominant rule in SCALE_MICRO_DRILL.md.
#
# Usage:
#   bash scripts/ci/run_scale_micro_drill.sh
#   bash scripts/ci/run_scale_micro_drill.sh --drills A,B
#
# Env:
#   ARCHLUCID_BASE_URL
#   ARCHLUCID_API_KEY / scope GUIDs (see scale-drill-k6-common.js)
#   ARCHLUCID_LOAD_TEST_WRITES=true  (drill A writes + drill C exports)
#   SCALE_DRILL_OUT_DIR

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

drills="A,B,C"
if [[ "${1:-}" == "--drills" && -n "${2:-}" ]]; then
  drills="${2^^}"
  shift 2
fi

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is required. Install via https://k6.io/docs/get-started/installation/."
  exit 1
fi

api_base="${ARCHLUCID_BASE_URL:-http://127.0.0.1:5128}"
out_dir="${SCALE_DRILL_OUT_DIR:-artifacts/scale-micro-drill/$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$out_dir"

echo "Scale micro-drill TB-946 — API base=${api_base} out=${out_dir} drills=${drills}"

run_drill() {
  local id="$1"
  local script="$2"
  local summary_name="$3"
  echo "--- Drill ${id} ---"
  k6 run \
    -e "ARCHLUCID_BASE_URL=${api_base}" \
    -e "ARCHLUCID_API_KEY=${ARCHLUCID_API_KEY:-}" \
    -e "ARCHLUCID_LOAD_TEST_WRITES=${ARCHLUCID_LOAD_TEST_WRITES:-false}" \
    --summary-export="${out_dir}/${summary_name}" \
    "${script}" | tee "${out_dir}/scale-drill-${id,,}.log"
}

if [[ "$drills" == *"A"* ]]; then
  run_drill "A" "scripts/load/scale-drill-a-http-llm-wait.js" "scale-drill-a-summary.json"
fi

if [[ "$drills" == *"B"* ]]; then
  run_drill "B" "scripts/load/scale-drill-b-cpu-bound.js" "scale-drill-b-summary.json"
fi

if [[ "$drills" == *"C"* ]]; then
  run_drill "C" "scripts/load/scale-drill-c-worker-backlog.js" "scale-drill-c-summary.json"
fi

echo "Drill complete. Summaries under ${out_dir}"
echo "Record replica observations via scripts/ops/append-scale-micro-drill-results.ps1"
