#!/usr/bin/env bash
set -euo pipefail

# Pull official .NET bases with the registry API GET path before BuildKit metadata (HEAD-heavy).
# Builds can fail with: unexpected status from HEAD ... mcr.microsoft.com/... 403 Forbidden
# (MCR rate limits / WAF quirks; microsoft/aspire#16035, microsoft/containerregistry#188).
#
# Plain `docker pull` can also fail mid-handshake with TCP resets (RST) on busy or constrained
# networks; retries with backoff absorb transient MCR / path flake.

DOCKER_PULL_ATTEMPTS="${DOCKER_PULL_ATTEMPTS:-8}"
DOCKER_PULL_RETRY_BASE_SECONDS="${DOCKER_PULL_RETRY_BASE_SECONDS:-8}"

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

# Pull with bounded retries + exponential backoff (capped).
docker_pull_retry() {
  local image="$1"
  local attempt=1

  while true; do

    if docker pull "${image}"; then
      return 0
    fi

    if (( attempt >= DOCKER_PULL_ATTEMPTS )); then
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

echo "Prefetch DOTNET_SDK_IMAGE=${DOTNET_SDK_IMAGE}"
docker_pull_retry "${DOTNET_SDK_IMAGE}"

echo "Prefetch DOTNET_ASPNET_IMAGE=${DOTNET_ASPNET_IMAGE}"
docker_pull_retry "${DOTNET_ASPNET_IMAGE}"
