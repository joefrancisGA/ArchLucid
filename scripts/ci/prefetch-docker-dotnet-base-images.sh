#!/usr/bin/env bash
set -euo pipefail

# Pull official .NET bases with the registry API GET path before BuildKit metadata (HEAD-heavy).
# Builds can fail with: unexpected status from HEAD ... mcr.microsoft.com/... 403 Forbidden
# (MCR rate limits / WAF quirks; microsoft/aspire#16035, microsoft/containerregistry#188).
#
# Plain `docker pull` can also fail mid-handshake with TCP resets (RST) on busy or constrained
# networks; retries with backoff absorb transient MCR / path flake.
#
# WAF blocks return HTML "The request is blocked" (often misreported as "pull access denied").
# On a blocked runner IP, retries on the same job do not help — re-run the workflow for a fresh
# runner (microsoft/mssql-docker#964). We fail fast when that HTML is detected.

DOCKER_PULL_ATTEMPTS="${DOCKER_PULL_ATTEMPTS:-8}"
DOCKER_PULL_RETRY_BASE_SECONDS="${DOCKER_PULL_RETRY_BASE_SECONDS:-8}"
MCR_WAF_BLOCK_MARKER="The request is blocked"

die() {
  echo "Error: ${*}" >&2
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  die "docker is not installed or not on PATH"
fi

# Avoid long pull-retry loops when the daemon is down (common local dev miss).
if ! docker info >/dev/null 2>&1; then
  die "docker daemon is not running or not reachable (start Docker Desktop / dockerd)"
fi

# Some networks resolve MCR to IPv6 first and fail with RST/WAF; prefer IPv4 when we can.
maybe_disable_ipv6_for_mcr() {
  if [[ "${DOCKER_PREFETCH_DISABLE_IPV6:-}" == "0" ]]; then
    return 0
  fi

  if [[ "${DOCKER_PREFETCH_DISABLE_IPV6:-}" != "1" && "${GITHUB_ACTIONS:-}" != "true" ]]; then
    return 0
  fi

  if sysctl net.ipv6.conf.all.disable_ipv6=1 net.ipv6.conf.default.disable_ipv6=1 >/dev/null 2>&1; then
    echo "Disabled IPv6 for MCR pulls (microsoft/containerregistry#175 workaround)." >&2
  fi
}

die_mcr_waf_blocked() {
  local image="$1"
  local error_ref="${2:-unknown}"

  die "$(cat <<EOF
MCR WAF blocked docker pull for ${image} (Microsoft edge returned "${MCR_WAF_BLOCK_MARKER}").
This is not a missing tag or auth failure — the image exists on mcr.microsoft.com.
Ref: ${error_ref}
Mitigation: re-run the CI workflow (fresh runner IP). Retries on the same runner usually fail
(microsoft/mssql-docker#964). Local dev: retry later, disable IPv6, or use a VPN/network path
that can reach MCR.
EOF
)"
}

# Pull with bounded retries + exponential backoff (capped).
docker_pull_retry() {
  local image="$1"
  local attempt=1
  local pull_log=""
  pull_log="$(mktemp)"

  while true; do

    if docker pull "${image}" >"${pull_log}" 2>&1; then
      cat "${pull_log}"
      rm -f "${pull_log}"
      return 0
    fi

    cat "${pull_log}" >&2

    if grep -q "${MCR_WAF_BLOCK_MARKER}" "${pull_log}"; then
      local error_ref=""
      error_ref="$(grep -oE 'Ref [ABC]: [^<]+' "${pull_log}" | tr '\n' ' ' | sed 's/[[:space:]]*$//' || true)"
      rm -f "${pull_log}"
      die_mcr_waf_blocked "${image}" "${error_ref:-see log above}"
    fi

    if (( attempt >= DOCKER_PULL_ATTEMPTS )); then
      rm -f "${pull_log}"
      die "docker pull failed after ${DOCKER_PULL_ATTEMPTS} attempt(s): ${image}"
    fi

    # Backoff 8s, 16s, 32s, ... capped at 120s between attempts (not counting jitter).
    local wait_seconds=$((DOCKER_PULL_RETRY_BASE_SECONDS * (1 << (attempt - 1))))

    if (( wait_seconds > 120 )); then
      wait_seconds=120
    fi

    echo "docker pull retry ${attempt}/${DOCKER_PULL_ATTEMPTS} for ${image} after ${wait_seconds}s..." >&2
    sleep "${wait_seconds}"

    attempt=$((attempt + 1))
  done
}

DOTNET_SDK_IMAGE="${DOTNET_SDK_IMAGE:-mcr.microsoft.com/dotnet/sdk:10.0.201-alpine3.23}"
DOTNET_ASPNET_IMAGE="${DOTNET_ASPNET_IMAGE:-mcr.microsoft.com/dotnet/aspnet:10.0-alpine3.23}"

maybe_disable_ipv6_for_mcr

echo "Prefetch DOTNET_SDK_IMAGE=${DOTNET_SDK_IMAGE}"
docker_pull_retry "${DOTNET_SDK_IMAGE}"

echo "Prefetch DOTNET_ASPNET_IMAGE=${DOTNET_ASPNET_IMAGE}"
docker_pull_retry "${DOTNET_ASPNET_IMAGE}"
