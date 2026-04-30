#!/usr/bin/env bash
# Build ArchLucid.Api.Tests and verify OpenAPI v1 matches the committed snapshot.
# Same assertion as CI job "openapi-contract-snapshot".
#
# Usage (repo root or any cwd):
#   bash scripts/ci/check_openapi_contract_snapshot.sh
#
# Regenerate snapshot after intentional API changes:
#   ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1 bash scripts/ci/check_openapi_contract_snapshot.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

dotnet restore ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj

REV="$(git rev-parse HEAD 2>/dev/null || printf 'local')"
dotnet build ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --no-restore -c Release \
  "/p:SourceRevisionId=${REV}"

dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --no-build \
  -c Release \
  --filter "FullyQualifiedName~OpenApiContractSnapshotTests"
