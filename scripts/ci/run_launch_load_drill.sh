#!/usr/bin/env bash
# Launch load drill — runs public showcase UI burst + authenticated API read burst (LATEST_EXPOSURE §20 Tier 3).
# Measurement-first: thresholds are warn-only inside k6 scripts; failures are reported, not merge-blocking.
#
# Usage (from repo root, after UI build + mock stack are running):
#   bash scripts/ci/run_launch_load_drill.sh
#
# Optional env:
#   ARCHLUCID_UI_BASE_URL   UI origin (default http://127.0.0.1:3000)
#   ARCHLUCID_BASE_URL      API origin (default http://127.0.0.1:5128)
#   K6_SHOWCASE_PEAK_VUS / K6_AUTH_PEAK_VUS
#   LAUNCH_DRILL_OUT_DIR    summary directory (default artifacts/launch-load-drill/$(date +%Y%m%d))

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is required. Install via scripts/ci/install_k6_apt.sh (Linux) or https://k6.io/docs/get-started/installation/."
  exit 1
fi

ui_base="${ARCHLUCID_UI_BASE_URL:-http://127.0.0.1:3000}"
api_base="${ARCHLUCID_BASE_URL:-http://127.0.0.1:5128}"
out_dir="${LAUNCH_DRILL_OUT_DIR:-artifacts/launch-load-drill/$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$out_dir"

echo "Launch load drill — UI base=${ui_base} API base=${api_base} out=${out_dir}"

k6 run \
  -e "ARCHLUCID_UI_BASE_URL=${ui_base}" \
  -e "K6_SHOWCASE_PEAK_VUS=${K6_SHOWCASE_PEAK_VUS:-50}" \
  --summary-export="${out_dir}/public-showcase-burst-summary.json" \
  scripts/load/public-showcase-burst.js | tee "${out_dir}/public-showcase-burst.log"

k6 run \
  -e "ARCHLUCID_BASE_URL=${api_base}" \
  -e "K6_AUTH_PEAK_VUS=${K6_AUTH_PEAK_VUS:-15}" \
  --summary-export="${out_dir}/authenticated-first-review-burst-summary.json" \
  scripts/load/authenticated-first-review-burst.js | tee "${out_dir}/authenticated-first-review-burst.log"

echo "Drill complete. Summaries written under ${out_dir}"
echo "Document p50/p95/p99 and error rates in docs/architecture/LAUNCH_LOAD_DRILL.md (latest run section)."
