#!/usr/bin/env bash
# Regenerate the OpenAPI v1 CI baseline snapshot from the live test host.
# Optional downstream client refresh via env flags (see OPENAPI_CONTRACT_DRIFT.md).
#
# Usage (repo root):
#   bash scripts/ci/update_openapi_contract_snapshot.sh
#
# Optional:
#   ARCHLUCID_REGENERATE_UI_API_TYPES=1   — refresh archlucid-ui api-types.generated.ts
#
# Always regenerates ArchLucid.Api.Client via NSwag (output is gitignored) and buyer-contract.openapi.snapshot.json.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1
bash scripts/ci/check_openapi_contract_snapshot.sh

echo "Regenerating buyer-tier OpenAPI contract snapshot from live /openapi/v1.json..."
export ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT=1
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --no-build \
  -c Release \
  --filter "FullyQualifiedName~OpenApiBuyerContractSnapshotTests"
unset ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT

echo "Regenerating ArchLucid.Api.Client (NSwag) from v1 baseline..."
dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release

if [ "${ARCHLUCID_REGENERATE_UI_API_TYPES:-0}" = "1" ]; then
  echo "Regenerating archlucid-ui TypeScript API types..."
  cd "${ROOT}/archlucid-ui"
  npx --yes openapi-typescript ../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json \
    -o src/lib/api-types.generated.ts
  cd "$ROOT"
  echo "Verifying api-types.generated.ts is now in sync..."
  bash scripts/ci/assert_api_types_in_sync.sh
fi

echo "Verifying snapshots match generated /openapi/v1.json..."
unset ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT
bash scripts/ci/check_openapi_contract_snapshot.sh

echo "OpenAPI contract snapshot refresh complete."
