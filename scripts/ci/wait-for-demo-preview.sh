#!/usr/bin/env bash
# Post-readiness gate: demo seed + GET /v1/demo/preview for live E2E release-gate smokes.
# Usage: wait-for-demo-preview.sh
# Env: API_URL (default http://127.0.0.1:5128)
#      ARCHLUCID_DEMO_PREVIEW_WAIT_ATTEMPTS (default 90)
#      ARCHLUCID_DEMO_PREVIEW_WAIT_SLEEP_SECONDS (default 2)
#      ARCHLUCID_DEMO_SEED_CURL_MAX_TIME_SECONDS (default 300)
#      ARCHLUCID_API_LOG_FILE (optional — tail on failure)
#      ARCHLUCID_DEMO_WORKSPACES_MANIFEST or DEMO_WORKSPACES_MANIFEST
#        (default fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json; resolved from repo root)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/resolve-demo-workspaces-manifest.sh
source "${SCRIPT_DIR}/lib/resolve-demo-workspaces-manifest.sh"

API_URL="${API_URL:-http://127.0.0.1:5128}"
MAX_ATTEMPTS="${ARCHLUCID_DEMO_PREVIEW_WAIT_ATTEMPTS:-90}"
SLEEP_SECONDS="${ARCHLUCID_DEMO_PREVIEW_WAIT_SLEEP_SECONDS:-2}"
SEED_CURL_MAX_TIME_SECONDS="${ARCHLUCID_DEMO_SEED_CURL_MAX_TIME_SECONDS:-300}"
API_LOG_FILE="${ARCHLUCID_API_LOG_FILE:-}"

MANIFEST_PATH="$(resolve_demo_workspaces_manifest_path)" || exit 1
echo "Using demo workspaces manifest: ${MANIFEST_PATH}"

last_seed_code=""
last_preview_code=""
last_preview_body=""

# Optional auth for ApiKey / JwtBearer nightlies (DevelopmentBypass needs none).
# Env: LIVE_API_KEY or LIVE_JWT_TOKEN / ARCHLUCID_PROXY_BEARER_TOKEN
auth_curl_args=()
if [ -n "${LIVE_API_KEY:-}" ]; then
  auth_curl_args+=(-H "X-Api-Key: ${LIVE_API_KEY}")
elif [ -n "${LIVE_JWT_TOKEN:-}" ]; then
  auth_curl_args+=(-H "Authorization: Bearer ${LIVE_JWT_TOKEN}")
elif [ -n "${ARCHLUCID_PROXY_BEARER_TOKEN:-}" ]; then
  auth_curl_args+=(-H "Authorization: Bearer ${ARCHLUCID_PROXY_BEARER_TOKEN}")
fi

post_demo_seed() {
  local body_file
  body_file="$(mktemp)"
  last_seed_code="$(
    curl -sS --max-time "${SEED_CURL_MAX_TIME_SECONDS}" -o "${body_file}" -w "%{http_code}" \
      -X POST "${API_URL}/v1/demo/seed" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      "${auth_curl_args[@]}" \
      -d '{}' || true
  )"
  if [ "${last_seed_code}" != "204" ] && [ "${last_seed_code}" != "200" ]; then
    echo "::warning::POST /v1/demo/seed returned HTTP ${last_seed_code}: $(head -c 500 "${body_file}" 2>/dev/null || true)"
  fi
  rm -f "${body_file}"
}

probe_demo_preview() {
  local body_file
  body_file="$(mktemp)"
  last_preview_code="$(
    curl -sS -o "${body_file}" -w "%{http_code}" \
      "${API_URL}/v1/demo/preview" \
      -H "Accept: application/json" \
      "${auth_curl_args[@]}" || true
  )"
  last_preview_body="$(head -c 500 "${body_file}" 2>/dev/null || true)"
  rm -f "${body_file}"
}

dump_demo_preview_diagnostics() {
  echo "---- POST ${API_URL}/v1/demo/seed (last attempt) HTTP ${last_seed_code} ----"
  post_demo_seed
  echo "---- GET ${API_URL}/v1/demo/preview (last attempt) HTTP ${last_preview_code} ----"
  echo "${last_preview_body}"
  echo ""
  if [ -n "${API_LOG_FILE}" ] && [ -f "${API_LOG_FILE}" ]; then
    echo "---- Recent API log ----"
    tail -n 200 "${API_LOG_FILE}" 2>/dev/null || true
  fi
}

echo "Ensuring demo seed and GET ${API_URL}/v1/demo/preview return 200..."

for i in $(seq 1 "${MAX_ATTEMPTS}"); do
  # Re-seed on first attempt and every 5th poll so committed demo data exists before preview probes.
  if [ "$i" -eq 1 ] || [ $((i % 5)) -eq 0 ]; then
    post_demo_seed
  fi

  probe_demo_preview
  if [ "${last_preview_code}" = "200" ]; then
    echo "Demo preview ready."
    exit 0
  fi

  if [ "$i" -eq "${MAX_ATTEMPTS}" ]; then
    echo "::error::GET /v1/demo/preview did not return 200 in time (last HTTP ${last_preview_code})"
    dump_demo_preview_diagnostics
    exit 1
  fi

  sleep "${SLEEP_SECONDS}"
done
