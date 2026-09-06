#!/usr/bin/env bash
# JIT-warm authenticated read paths before private-beta Playwright so the UI proxy does not
# burn 60s per draft-list attempt on cold SQL / first controller hit.
#
# Draft inventory is best-effort when LIVE_E2E_PRIVATE_BETA_ACCESS=1: Playwright stubs
# **/api/proxy/v1/architecture/draft** and cold SQL can hang the list endpoint for minutes.
#
# Usage: warm_private_beta_live_api_paths.sh <jwt-token>
# Env: API_URL (default http://127.0.0.1:5128)
set -euo pipefail

TOKEN="${1:?usage: warm_private_beta_live_api_paths.sh <jwt-token>}"
API_URL="${API_URL:-http://127.0.0.1:5128}"
ATTEMPTS="${ARCHLUCID_PRIVATE_BETA_WARMUP_ATTEMPTS:-5}"
SLEEP_SECONDS="${ARCHLUCID_PRIVATE_BETA_WARMUP_SLEEP_SECONDS:-3}"
CURL_MAX_TIME="${ARCHLUCID_PRIVATE_BETA_WARMUP_MAX_TIME:-120}"

warm_path() {
  local label="$1"
  local url="$2"
  local max_time="${3:-${CURL_MAX_TIME}}"
  local max_attempts="${4:-${ATTEMPTS}}"
  local attempt=1

  while [ "${attempt}" -le "${max_attempts}" ]; do
    if curl -fsS \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Accept: application/json" \
      --max-time "${max_time}" \
      "${url}" >/dev/null; then
      echo "Warmed ${label}."
      return 0
    fi

    if [ "${attempt}" -eq "${max_attempts}" ]; then
      echo "::error::Failed to warm ${label} at ${url} after ${max_attempts} attempts" >&2
      return 1
    fi

    echo "Warm ${label} attempt ${attempt}/${max_attempts} failed; retrying in ${SLEEP_SECONDS}s..."
    sleep "${SLEEP_SECONDS}"
    attempt=$((attempt + 1))
  done
}

warm_path_optional() {
  local label="$1"
  local url="$2"
  local max_time="${3:-${CURL_MAX_TIME}}"
  local max_attempts="${4:-${ATTEMPTS}}"

  if warm_path "${label}" "${url}" "${max_time}" "${max_attempts}"; then
    return 0
  fi

  echo "::warning::Optional warm skipped for ${label}; Playwright stubs draft inventory in private-beta smoke." >&2
  return 0
}

warm_path_post() {
  local label="$1"
  local url="$2"
  local body="$3"
  local max_time="${4:-${CURL_MAX_TIME}}"
  local max_attempts="${5:-${ATTEMPTS}}"
  local attempt=1

  while [ "${attempt}" -le "${max_attempts}" ]; do
    local status
    status="$(curl -sS -o /dev/null -w "%{http_code}" \
      -X POST \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      --max-time "${max_time}" \
      -d "${body}" \
      "${url}" || true)"

    if [ "${status}" = "200" ] || [ "${status}" = "201" ]; then
      echo "Warmed ${label} (HTTP ${status})."
      return 0
    fi

    if [ "${attempt}" -eq "${max_attempts}" ]; then
      echo "::error::Failed to warm ${label} at ${url} after ${max_attempts} attempts (last HTTP ${status})" >&2
      return 1
    fi

    echo "Warm ${label} attempt ${attempt}/${max_attempts} failed (HTTP ${status}); retrying in ${SLEEP_SECONDS}s..."
    sleep "${SLEEP_SECONDS}"
    attempt=$((attempt + 1))
  done
}

warm_path_post_optional() {
  local label="$1"
  local url="$2"
  local body="$3"
  local max_time="${4:-${CURL_MAX_TIME}}"
  local max_attempts="${5:-${ATTEMPTS}}"

  if warm_path_post "${label}" "${url}" "${body}" "${max_time}" "${max_attempts}"; then
    return 0
  fi

  echo "::warning::Optional warm skipped for ${label}; Playwright createRun will JIT-warm with per-attempt HTTP budget." >&2
  return 0
}

echo "Warming private-beta API paths at ${API_URL}..."
warm_path "auth scope" "${API_URL}/v1/scope"
warm_path "pending invitations" "${API_URL}/v1/admin/users/invitations"

if [ "${LIVE_E2E_PRIVATE_BETA_ACCESS:-}" = "1" ]; then
  # Invite-wave CI: Playwright stubs draft inventory in-browser and JIT-warms create-run with a
  # 300s per-attempt HTTP budget. Shell warm for those paths ties up the API for minutes and can
  # leave /health/ready at 503 before Playwright starts (see run 34003221895).
  echo "Skipping draft inventory and create-run shell warm (LIVE_E2E_PRIVATE_BETA_ACCESS=1); Playwright handles both."
else
  warm_path "draft inventory" "${API_URL}/v1/architecture/draft?mine=true&page=1&pageSize=1"
fi

echo "Private-beta API warm-up complete."
