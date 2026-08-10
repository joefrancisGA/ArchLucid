#!/usr/bin/env bash
# Post-demo gate: poll Contoso trusted-baseline endpoints used by live-api-demo-screenshots preflight.
# Usage: wait-for-demo-screenshot-preflight.sh
# Env: API_URL (default http://127.0.0.1:5128)
#      ARCHLUCID_DEMO_SCREENSHOT_PREFLIGHT_WAIT_ATTEMPTS (default 60)
#      ARCHLUCID_DEMO_SCREENSHOT_PREFLIGHT_WAIT_SLEEP_SECONDS (default 2)
#      ARCHLUCID_API_LOG_FILE (optional — tail on failure)
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:5128}"
MAX_ATTEMPTS="${ARCHLUCID_DEMO_SCREENSHOT_PREFLIGHT_WAIT_ATTEMPTS:-60}"
SLEEP_SECONDS="${ARCHLUCID_DEMO_SCREENSHOT_PREFLIGHT_WAIT_SLEEP_SECONDS:-2}"
API_LOG_FILE="${ARCHLUCID_API_LOG_FILE:-}"

TRUSTED_BASELINE_RUN_ID_N="6e8c4a102b1f4c9a9d3e10b2a4f0c501"
GRAPH_RUN_SEGMENT="6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501"

last_label=""
last_status=""
last_body=""

probe_http() {
  local label="$1"
  local url="$2"
  local body_file
  body_file="$(mktemp)"
  last_label="${label}"
  last_status="$(
    curl -sS -o "${body_file}" -w "%{http_code}" \
      "${url}" \
      -H "Accept: application/json" || true
  )"
  last_body="$(head -c 500 "${body_file}" 2>/dev/null || true)"
  rm -f "${body_file}"
}

graph_has_nodes_and_edges() {
  local body_file
  body_file="$(mktemp)"
  curl -sS -o "${body_file}" \
    "${API_URL}/v1/evidence-graph/reviews/${GRAPH_RUN_SEGMENT}" \
    -H "Accept: application/json" || true
  local node_count edge_count
  node_count="$(jq -r '(.nodes // []) | length' "${body_file}" 2>/dev/null || echo 0)"
  edge_count="$(jq -r '(.edges // []) | length' "${body_file}" 2>/dev/null || echo 0)"
  rm -f "${body_file}"
  [ "${node_count}" -ge 1 ] && [ "${edge_count}" -ge 1 ]
}

audit_has_events() {
  local body_file
  body_file="$(mktemp)"
  curl -sS -o "${body_file}" \
    "${API_URL}/v1/audit?take=200" \
    -H "Accept: application/json" || true
  local count
  count="$(jq -r '(.items // []) | length' "${body_file}" 2>/dev/null || echo 0)"
  rm -f "${body_file}"
  [ "${count}" -ge 1 ]
}

trusted_baseline_preflight_ready() {
  probe_http "trusted baseline architecture run" \
    "${API_URL}/v1/architecture/review/${TRUSTED_BASELINE_RUN_ID_N}"
  if [ "${last_status}" != "200" ]; then
    return 1
  fi

  local golden_manifest_id
  golden_manifest_id="$(
    curl -sS "${API_URL}/v1/architecture/review/${TRUSTED_BASELINE_RUN_ID_N}" \
      -H "Accept: application/json" | jq -r '.run.goldenManifestId // empty' 2>/dev/null || true
  )"
  if [ -z "${golden_manifest_id}" ]; then
    last_label="trusted baseline golden manifest id"
    last_status="missing"
    last_body="run.goldenManifestId empty"
    return 1
  fi

  probe_http "trusted baseline signed-review-record summary" \
    "${API_URL}/v1/authority/signed-review-records/${golden_manifest_id}/summary"
  if [ "${last_status}" != "200" ]; then
    return 1
  fi

  if ! graph_has_nodes_and_edges; then
    last_label="graph API nodes/edges"
    last_status="not-ready"
    last_body="need at least one node and one edge"
    return 1
  fi

  if ! audit_has_events; then
    last_label="audit API events"
    last_status="not-ready"
    last_body="need at least one audit event"
    return 1
  fi

  return 0
}

dump_preflight_diagnostics() {
  echo "---- ${last_label}: HTTP ${last_status} ----"
  echo "${last_body}"
  echo ""
  if [ -n "${API_LOG_FILE}" ] && [ -f "${API_LOG_FILE}" ]; then
    echo "---- Recent API log ----"
    tail -n 200 "${API_LOG_FILE}" 2>/dev/null || true
  fi
}

echo "Waiting for demo screenshot preflight endpoints (up to $((MAX_ATTEMPTS * SLEEP_SECONDS))s)..."

for i in $(seq 1 "${MAX_ATTEMPTS}"); do
  if trusted_baseline_preflight_ready; then
    echo "Demo screenshot preflight endpoints ready."
    exit 0
  fi

  if [ "$i" -eq "${MAX_ATTEMPTS}" ]; then
    echo "::error::demo screenshot preflight endpoints not ready in time (last: ${last_label} HTTP ${last_status})"
    dump_preflight_diagnostics
    exit 1
  fi

  echo "Attempt ${i}/${MAX_ATTEMPTS}: ${last_label} status=${last_status}"
  sleep "${SLEEP_SECONDS}"
done
