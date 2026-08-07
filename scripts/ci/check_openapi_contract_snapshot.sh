#!/usr/bin/env bash
# Build ArchLucid.Api.Tests and verify OpenAPI v1 and buyer-tier snapshots match CI baselines.
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

bash scripts/ci/ensure_openapi_contract_build.sh

dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --no-build \
  -c Release \
  --settings test.runsettings \
  --filter "FullyQualifiedName~OpenApiContractSnapshotTests"

# Buyer snapshot is refreshed in a separate step during v1-only baseline updates.
if [ "${ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT:-}" != "1" ]; then
  dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
    --no-build \
    -c Release \
    --settings test.runsettings \
    --filter "FullyQualifiedName~OpenApiBuyerContractSnapshotTests"
fi
