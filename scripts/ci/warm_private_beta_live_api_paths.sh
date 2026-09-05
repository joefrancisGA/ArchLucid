#!/usr/bin/env bash
# JIT-warm authenticated read paths before private-beta Playwright so the UI proxy does not
# burn 60s per draft-list attempt on cold SQL / first controller hit.
#
# Usage: warm_private_beta_live_api_paths.sh <jwt-token>
# Env: API_URL (default http://127.0.0.1:5128)
set -euo pipefail

TOKEN="${1:?usage: warm_private_beta_live_api_paths.sh <jwt-token>}"
API_URL="${API_URL:-http://127.0.0.1:5128}"
ATTEMPTS="${ARCHLUCID_PRIVATE_BETA_WARMUP_ATTEMPTS:-5}"
SLEEP_SECONDS="${ARCHLUCID_PRIVATE_BETA_WARMUP_SLEEP_SECONDS:-3}"

warm_path() {
  local label="$1"
  local url="$2"
  local attempt=1

  while [ "${attempt}" -le "${ATTEMPTS}" ]; do
    if curl -fsS \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Accept: application/json" \
      --max-time 120 \
      "${url}" >/dev/null; then
      echo "Warmed ${label}."
      return 0
    fi

    if [ "${attempt}" -eq "${ATTEMPTS}" ]; then
      echo "::error::Failed to warm ${label} at ${url} after ${ATTEMPTS} attempts" >&2
      return 1
    fi

    echo "Warm ${label} attempt ${attempt}/${ATTEMPTS} failed; retrying in ${SLEEP_SECONDS}s..."
    sleep "${SLEEP_SECONDS}"
    attempt=$((attempt + 1))
  done
}

echo "Warming private-beta API paths at ${API_URL}..."
warm_path "draft inventory" "${API_URL}/v1/architecture/draft?mine=true&page=1&pageSize=1"
warm_path "pending invitations" "${API_URL}/v1/admin/users/invitations"
warm_path "auth scope" "${API_URL}/v1/scope"
echo "Private-beta API warm-up complete."
