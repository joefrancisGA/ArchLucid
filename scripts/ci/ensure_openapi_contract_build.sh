#!/usr/bin/env bash
# Restore and build ArchLucid.Api.Tests for OpenAPI snapshot checks with a repo-local NuGet cache
# and restore fingerprinting so repeat pre-push runs skip redundant restores.
#
# Usage (repo root):
#   bash scripts/ci/ensure_openapi_contract_build.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CACHE_ROOT="$ROOT/.cache"
NUGET_PACKAGES="$CACHE_ROOT/nuget-packages"
RESTORE_STAMP="$CACHE_ROOT/openapi-contract-restore.stamp"
mkdir -p "$NUGET_PACKAGES"
export NUGET_PACKAGES

fingerprint() {
  local payload
  payload="$(
    {
      cat "$ROOT/global.json" 2>/dev/null || true
      cat "$ROOT/Directory.Packages.props" 2>/dev/null || true
      cat "$ROOT/ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj" 2>/dev/null || true
    } | tr -d '\r'
  )"
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$payload" | sha256sum | awk '{print $1}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$payload" | shasum -a 256 | awk '{print $1}'
    return
  fi
  echo "ensure_openapi_contract_build.sh requires sha256sum or shasum" >&2
  exit 1
}

FP="$(fingerprint)"
NEEDS_RESTORE=1
if [[ -f "$RESTORE_STAMP" ]] && [[ "$(cat "$RESTORE_STAMP")" == "$FP" ]]; then
  NEEDS_RESTORE=0
fi

if [[ "$NEEDS_RESTORE" -eq 1 ]]; then
  dotnet restore ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj
  printf '%s' "$FP" > "$RESTORE_STAMP"
fi

REV="$(git rev-parse HEAD 2>/dev/null || printf 'local')"
dotnet build ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --no-restore \
  -c Release \
  "/p:SourceRevisionId=${REV}"
