#!/usr/bin/env bash
# Optional post-readiness gate: demo seed + GET /v1/demo/preview for live E2E release-gate smokes.
# Usage: wait-for-demo-preview.sh
# Env: API_URL (default http://127.0.0.1:5128), ARCHLUCID_DEMO_PREVIEW_WAIT_ATTEMPTS (default 60)
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:5128}"
MAX_ATTEMPTS="${ARCHLUCID_DEMO_PREVIEW_WAIT_ATTEMPTS:-60}"
SLEEP_SECONDS="${ARCHLUCID_DEMO_PREVIEW_WAIT_SLEEP_SECONDS:-2}"

echo "Ensuring demo seed and GET ${API_URL}/v1/demo/preview return 200..."
seed_code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${API_URL}/v1/demo/seed" -H "Accept: application/json" -H "Content-Type: application/json" -d '{}' || true)"
if [ "${seed_code}" != "204" ] && [ "${seed_code}" != "200" ]; then
  echo "::warning::POST /v1/demo/seed returned HTTP ${seed_code} (continuing to poll preview)"
fi

for i in $(seq 1 "${MAX_ATTEMPTS}"); do
  preview_code="$(curl -sS -o /dev/null -w "%{http_code}" "${API_URL}/v1/demo/preview" -H "Accept: application/json" || true)"
  if [ "${preview_code}" = "200" ]; then
    echo "Demo preview ready."
    exit 0
  fi

  if [ "$i" -eq "${MAX_ATTEMPTS}" ]; then
    echo "::error::GET /v1/demo/preview did not return 200 in time (last HTTP ${preview_code})"
    exit 1
  fi

  sleep "${SLEEP_SECONDS}"
done
