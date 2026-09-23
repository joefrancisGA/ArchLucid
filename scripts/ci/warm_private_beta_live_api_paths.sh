#!/usr/bin/env bash
# JIT-warm authenticated read paths before private-beta Playwright so the UI proxy does not
# burn 60s per draft-list attempt on cold SQL / first controller hit.
#
# Draft inventory and create-run shell warm are skipped when LIVE_E2E_PRIVATE_BETA_ACCESS=1:
# Playwright stubs **/api/proxy/v1/architecture/draft** and JIT-warms create-run in-spec.
#
# Usage: warm_private_beta_live_api_paths.sh <jwt-token>
# Env: API_URL (default http://127.0.0.1:5128)
set -euo pipefail

TOKEN="${1:?usage: warm_private_beta_live_api_paths.sh <jwt-token>}"
API_URL="${API_URL:-http://127.0.0.1:5128}"
ATTEMPTS="${ARCHLUCID_PRIVATE_BETA_WARMUP_ATTEMPTS:-5}"
SLEEP_SECONDS="${ARCHLUCID_PRIVATE_BETA_WARMUP_SLEEP_SECONDS:-3}"
CURL_MAX_TIME="${ARCHLUCID_PRIVATE_BETA_WARMUP_MAX_TIME:-120}"

if [ "${LIVE_E2E_PRIVATE_BETA_ACCESS:-}" = "1" ]; then
  # Invite-wave: do not burn 120s per GET when SQL is cold or the API is unreachable (HTTP 000).
  ATTEMPTS="${ARCHLUCID_PRIVATE_BETA_WARMUP_ATTEMPTS:-2}"
  CURL_MAX_TIME="${ARCHLUCID_PRIVATE_BETA_WARMUP_MAX_TIME:-20}"
fi

http_status() {
  local method="$1"
  local url="$2"
  local max_time="$3"
  local extra_args=()

  if [ "${method}" = "POST" ]; then
    extra_args+=(-X POST -H "Content-Type: application/json" -d "$4")
  fi

  curl -sS -o /dev/null -w "%{http_code}" \
    "${extra_args[@]}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/json" \
    --max-time "${max_time}" \
    "${url}" || true
}

probe_health_ready() {
  local status
  status="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "${API_URL}/health/ready" || true)"

  case "${status}" in
    000|"")
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

describe_warm_failure() {
  local label="$1"
  local url="$2"
  local status="$3"

  if [ "${status}" = "000" ] || [ -z "${status}" ]; then
    echo "::error::Failed to warm ${label} at ${url}: API unreachable (HTTP 000). Skipping remaining 120s retries." >&2
    return
  fi

  if [ "${status}" = "401" ]; then
    echo "::error::Failed to warm ${label} at ${url}: HTTP 401. JwtBearer token may be expired or not forwarded. Re-mint with scripts/ci/refresh_private_beta_ci_jwt.sh before Playwright." >&2
    return
  fi

  echo "::error::Failed to warm ${label} at ${url} (last HTTP ${status})" >&2
}

warm_path() {
  local label="$1"
  local url="$2"
  local max_time="${3:-${CURL_MAX_TIME}}"
  local max_attempts="${4:-${ATTEMPTS}}"
  local attempt=1

  while [ "${attempt}" -le "${max_attempts}" ]; do
    local status
    status="$(http_status GET "${url}" "${max_time}")"

    if [ "${status}" = "200" ] || [ "${status}" = "204" ]; then
      echo "Warmed ${label} (HTTP ${status})."
      return 0
    fi

    if [ "${status}" = "000" ] || [ -z "${status}" ]; then
      describe_warm_failure "${label}" "${url}" "${status}"
      return 2
    fi

    if [ "${attempt}" -eq "${max_attempts}" ]; then
      describe_warm_failure "${label}" "${url}" "${status}"
      return 1
    fi

    echo "Warm ${label} attempt ${attempt}/${max_attempts} failed (HTTP ${status}); retrying in ${SLEEP_SECONDS}s..."
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
    status="$(http_status POST "${url}" "${max_time}" "${body}")"

    if [ "${status}" = "200" ] || [ "${status}" = "201" ]; then
      echo "Warmed ${label} (HTTP ${status})."
      return 0
    fi

    if [ "${status}" = "000" ] || [ -z "${status}" ]; then
      describe_warm_failure "${label}" "${url}" "${status}"
      return 2
    fi

    if [ "${attempt}" -eq "${max_attempts}" ]; then
      describe_warm_failure "${label}" "${url}" "${status}"
      return 1
    fi

    echo "Warm ${label} attempt ${attempt}/${max_attempts} failed (HTTP ${status}); retrying in ${SLEEP_SECONDS}s..."
    sleep "${SLEEP_SECONDS}"
    attempt=$((attempt + 1))

    # Partial create-run failures can persist requestId/systemName; rotate identity before retry.
    if [ "${label}" = "create architecture run" ]; then
      local retry_suffix
      retry_suffix="$(date +%s)-$$-${attempt}"
      body="{\"requestId\":\"WARM-PRIVATE-BETA-${retry_suffix}\",\"description\":\"Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.\",\"systemName\":\"PrivateBetaPipelineWarm-${retry_suffix}\",\"environment\":\"prod\",\"cloudProvider\":1,\"constraints\":[\"Private endpoints required\",\"Use managed identity\"],\"requiredCapabilities\":[\"Azure AI Search\",\"SQL\",\"Managed Identity\",\"Private Networking\"],\"assumptions\":[],\"priorManifestVersion\":null}"
    fi
  done
}

warm_path_post_optional() {
  local label="$1"
  local url="$2"
  local body="$3"
  local max_time="${4:-${CURL_MAX_TIME}}"
  local max_attempts="${5:-${ATTEMPTS}}"

  local warm_status

  if warm_path_post "${label}" "${url}" "${body}" "${max_time}" "${max_attempts}"; then
    return 0
  else
    warm_status=$?
  fi

  echo "::warning::Optional warm skipped for ${label} (status ${warm_status}); Playwright createRun will JIT-warm with per-attempt HTTP budget." >&2
  return 0
}

echo "Warming private-beta API paths at ${API_URL}..."

if ! probe_health_ready; then
  echo "::error::${API_URL}/health/ready is unreachable (HTTP 000). Skipping remaining warms so invite-wave JWT refresh is not delayed by fail-closed /v1/scope GETs." >&2
  exit 1
fi

warm_path "auth scope" "${API_URL}/v1/scope"
warm_path "pending invitations" "${API_URL}/v1/admin/users/invitations"

if [ "${LIVE_E2E_PRIVATE_BETA_ACCESS:-}" = "1" ]; then
  # Skip create-run warm when the API is not accepting connections (curl HTTP 000).
  # A hung 120s POST does not help invite-wave Playwright and delays JWT refresh.
  if curl -fsS --max-time 5 "${API_URL}/health/ready" >/dev/null; then
    warm_suffix="$(date +%s)-$$"
    CREATE_BODY="{\"requestId\":\"WARM-PRIVATE-BETA-${warm_suffix}\",\"description\":\"Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.\",\"systemName\":\"PrivateBetaPipelineWarm-${warm_suffix}\",\"environment\":\"prod\",\"cloudProvider\":1,\"constraints\":[\"Private endpoints required\",\"Use managed identity\"],\"requiredCapabilities\":[\"Azure AI Search\",\"SQL\",\"Managed Identity\",\"Private Networking\"],\"assumptions\":[],\"priorManifestVersion\":null}"
    warm_path_post_optional \
      "create architecture run" \
      "${API_URL}/v1/architecture/request" \
      "${CREATE_BODY}" \
      "${ARCHLUCID_PRIVATE_BETA_CREATE_RUN_WARM_MAX_TIME:-20}" \
      "${ARCHLUCID_PRIVATE_BETA_CREATE_RUN_WARM_ATTEMPTS:-4}"
  else
    echo "::warning::Skipping create-run warm; ${API_URL}/health/ready is not reachable." >&2
  fi
  echo "Skipping draft inventory shell warm (LIVE_E2E_PRIVATE_BETA_ACCESS=1); Playwright stubs draft inventory in-browser."
else
  # Draft inventory can exceed the UI proxy 60s budget; keep the shell GET short.
  warm_path_optional \
    "draft inventory" \
    "${API_URL}/v1/architecture/draft?mine=true&page=1&pageSize=1" \
    "${ARCHLUCID_PRIVATE_BETA_DRAFT_WARM_MAX_TIME:-20}" \
    "${ARCHLUCID_PRIVATE_BETA_DRAFT_WARM_ATTEMPTS:-2}"
fi

echo "Private-beta API warm-up complete."
