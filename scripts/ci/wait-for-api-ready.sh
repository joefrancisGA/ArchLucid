#!/usr/bin/env bash
# Poll GET /health/ready until success or timeout; emit diagnostics on failure.
# Usage: wait-for-api-ready.sh <api_log_file>
# Env: API_URL (default http://127.0.0.1:5128),
#      ARCHLUCID_API_READY_WAIT_ATTEMPTS (default 180),
#      ARCHLUCID_API_READY_WAIT_SLEEP_SECONDS (default 2)
set -euo pipefail

LOG_FILE="${1:?usage: wait-for-api-ready.sh <api_log_file>}"
API_URL="${API_URL:-http://127.0.0.1:5128}"
READY_WAIT_ATTEMPTS="${ARCHLUCID_API_READY_WAIT_ATTEMPTS:-180}"
READY_WAIT_SLEEP_SECONDS="${ARCHLUCID_API_READY_WAIT_SLEEP_SECONDS:-2}"

dump_api_ready_diagnostics() {
  echo "---- GET ${API_URL}/health/ready (last attempt) ----"
  curl -sS "${API_URL}/health/ready" || true
  echo ""
  echo "---- API process ----"
  ps -ef | grep -i "[A]rchLucid.Api" || true
  echo "---- Port 5128 listeners ----"
  if command -v ss >/dev/null 2>&1; then
    ss -lntp | grep 5128 || true
  elif command -v netstat >/dev/null 2>&1; then
    netstat -lntp 2>/dev/null | grep 5128 || true
  fi
  echo "---- Recent API log ----"
  tail -n 200 "${LOG_FILE}" 2>/dev/null || true
  echo "---- SQL Server container logs ----"
  container_id="$(docker ps -q --filter "ancestor=mcr.microsoft.com/mssql/server:2022-latest" | head -n 1 || true)"
  if [ -n "${container_id}" ]; then
    docker logs "${container_id}" 2>&1 | tail -n 200 || true
  else
    echo "No MSSQL service container found."
  fi
}

echo "Waiting for ${API_URL}/health/ready (up to $((READY_WAIT_ATTEMPTS * READY_WAIT_SLEEP_SECONDS))s)..."
for i in $(seq 1 "${READY_WAIT_ATTEMPTS}"); do
  if curl -fsS "${API_URL}/health/ready" >/dev/null; then
    echo "API ready."
    exit 0
  fi

  if [ "$i" -eq "${READY_WAIT_ATTEMPTS}" ]; then
    echo "::error::API did not reach /health/ready in time"
    dump_api_ready_diagnostics
    exit 1
  fi

  sleep "${READY_WAIT_SLEEP_SECONDS}"
done
