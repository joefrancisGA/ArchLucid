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

BUILD_LOG="$(mktemp)"
trap 'rm -f "${BUILD_LOG}"' EXIT

if ! bash scripts/ci/ensure_openapi_contract_build.sh 2>&1 | tee "${BUILD_LOG}"; then
  error_codes="$(grep -oE '(CS|MSB)[0-9]{4}' "${BUILD_LOG}" | sort -u | paste -sd ',' - || true)"
  if [ -z "${error_codes}" ]; then
    error_codes="unclassified"
  fi

  echo "::error title=OpenAPI contract build failed::The OpenAPI snapshot tests were not reached because the contract test project failed to build (${error_codes}). Resolve compiler or restore errors before investigating snapshot drift."

  exit 1
fi

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
