#!/usr/bin/env bash
# Post-demo gate: poll GET /v1/pilots/runs/{runId}/pilot-run-deltas until HTTP 200 for demo workspace fixture runs.
# Usage: wait-for-db-backed-pilot-endpoint.sh
# Env: API_URL (default http://127.0.0.1:5128)
#      ARCHLUCID_DB_PILOT_WAIT_ATTEMPTS (default 60)
#      ARCHLUCID_DB_PILOT_WAIT_SLEEP_SECONDS (default 2)
#      ARCHLUCID_DEMO_WORKSPACES_MANIFEST or DEMO_WORKSPACES_MANIFEST
#        (default fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json; resolved from repo root)
#      ARCHLUCID_API_LOG_FILE (optional — tail on failure)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/resolve-demo-workspaces-manifest.sh
source "${SCRIPT_DIR}/lib/resolve-demo-workspaces-manifest.sh"

API_URL="${API_URL:-http://127.0.0.1:5128}"
MAX_ATTEMPTS="${ARCHLUCID_DB_PILOT_WAIT_ATTEMPTS:-60}"
SLEEP_SECONDS="${ARCHLUCID_DB_PILOT_WAIT_SLEEP_SECONDS:-2}"
API_LOG_FILE="${ARCHLUCID_API_LOG_FILE:-}"

MANIFEST="$(resolve_demo_workspaces_manifest_path)" || exit 1
echo "Using demo workspaces manifest: ${MANIFEST}"

TENANT_ID="$(jq -r '.defaultTenantId' "${MANIFEST}")"
RUN_A="$(jq -r '.workspaceA.runId' "${MANIFEST}")"
WS_A="$(jq -r '.workspaceA.workspaceId' "${MANIFEST}")"
PROJ_A="$(jq -r '.workspaceA.projectId' "${MANIFEST}")"
RUN_B="$(jq -r '.workspaceB.runId' "${MANIFEST}")"
WS_B="$(jq -r '.workspaceB.workspaceId' "${MANIFEST}")"
PROJ_B="$(jq -r '.workspaceB.projectId' "${MANIFEST}")"

last_status=""
last_body=""
last_label=""

# Optional auth for ApiKey / JwtBearer nightlies (DevelopmentBypass needs none).
auth_curl_args=()
if [ -n "${LIVE_API_KEY:-}" ]; then
  auth_curl_args+=(-H "X-Api-Key: ${LIVE_API_KEY}")
elif [ -n "${LIVE_JWT_TOKEN:-}" ]; then
  auth_curl_args+=(-H "Authorization: Bearer ${LIVE_JWT_TOKEN}")
elif [ -n "${ARCHLUCID_PROXY_BEARER_TOKEN:-}" ]; then
  auth_curl_args+=(-H "Authorization: Bearer ${ARCHLUCID_PROXY_BEARER_TOKEN}")
fi

probe_pilot_run_deltas() {
  local label="$1"
  local run_id="$2"
  local workspace_id="$3"
  local project_id="$4"
  local body_file
  body_file="$(mktemp)"
  last_label="${label}"
  last_status="$(
    curl -sS -o "${body_file}" -w "%{http_code}" \
      "${API_URL}/v1/pilots/runs/${run_id}/pilot-run-deltas" \
      -H "Accept: application/json" \
      -H "x-tenant-id: ${TENANT_ID}" \
      -H "x-workspace-id: ${workspace_id}" \
      -H "x-project-id: ${project_id}" \
      "${auth_curl_args[@]}" || true
  )"
  last_body="$(head -c 500 "${body_file}" 2>/dev/null || true)"
  rm -f "${body_file}"
}

probe_authority_run_detail() {
  local label="$1"
  local run_id="$2"
  local workspace_id="$3"
  local project_id="$4"
  local body_file
  body_file="$(mktemp)"
  last_label="${label}"
  last_status="$(
    curl -sS -o "${body_file}" -w "%{http_code}" \
      "${API_URL}/v1/authority/reviews/${run_id}" \
      -H "Accept: application/json" \
      -H "x-tenant-id: ${TENANT_ID}" \
      -H "x-workspace-id: ${workspace_id}" \
      -H "x-project-id: ${project_id}" \
      "${auth_curl_args[@]}" || true
  )"
  last_body="$(head -c 500 "${body_file}" 2>/dev/null || true)"
  rm -f "${body_file}"
}

all_pilot_endpoints_ready() {
  probe_authority_run_detail "workspace A product tour authority" "${RUN_A}" "${WS_A}" "${PROJ_A}"
  if [ "${last_status}" != "200" ]; then
    return 1
  fi

  probe_pilot_run_deltas "workspace A product tour" "${RUN_A}" "${WS_A}" "${PROJ_A}"
  if [ "${last_status}" != "200" ]; then
    return 1
  fi

  probe_authority_run_detail "workspace B regulated scenario authority" "${RUN_B}" "${WS_B}" "${PROJ_B}"
  if [ "${last_status}" != "200" ]; then
    return 1
  fi

  probe_pilot_run_deltas "workspace B regulated scenario" "${RUN_B}" "${WS_B}" "${PROJ_B}"
  if [ "${last_status}" != "200" ]; then
    return 1
  fi

  return 0
}

dump_pilot_diagnostics() {
  echo "---- ${last_label}: GET pilot-run-deltas HTTP ${last_status} ----"
  echo "${last_body}"
  echo ""
  if [ -n "${API_LOG_FILE}" ] && [ -f "${API_LOG_FILE}" ]; then
    echo "---- Recent API log ----"
    tail -n 200 "${API_LOG_FILE}" 2>/dev/null || true
  fi
}

echo "Waiting for DB-backed authority runs and pilot-run-deltas on demo workspace A and B (up to $((MAX_ATTEMPTS * SLEEP_SECONDS))s)..."

for i in $(seq 1 "${MAX_ATTEMPTS}"); do
  if all_pilot_endpoints_ready; then
    echo "DB-backed authority runs and pilot-run-deltas ready for workspace A and B."
    exit 0
  fi

  if [ "$i" -eq "${MAX_ATTEMPTS}" ]; then
    echo "::error::pilot-run-deltas did not return 200 in time (last: ${last_label} HTTP ${last_status})"
    dump_pilot_diagnostics
    exit 1
  fi

  echo "Attempt ${i}/${MAX_ATTEMPTS}: ${last_label} status=${last_status}"
  sleep "${SLEEP_SECONDS}"
done
