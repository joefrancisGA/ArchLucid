#!/usr/bin/env bash
# Regenerate the OpenAPI v1 CI baseline snapshot from the live test host.
# Optional downstream client refresh via env flags (see OPENAPI_CONTRACT_DRIFT.md).
#
# Usage (repo root):
#   bash scripts/ci/update_openapi_contract_snapshot.sh
#
# Optional:
#   ARCHLUCID_REGENERATE_UI_API_TYPES=1   — refresh split archlucid-ui/src/lib/api-types/ via generate-api-types-split.mjs
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
  --settings test.runsettings \
  --filter "FullyQualifiedName~OpenApiBuyerContractSnapshotTests"
unset ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT

echo "Regenerating ArchLucid.Api.Client (NSwag) from v1 baseline..."
dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release

if [ "${ARCHLUCID_REGENERATE_UI_API_TYPES:-0}" = "1" ]; then
  echo "Regenerating split api-types from the refreshed snapshot..."
  (cd "${ROOT}/archlucid-ui" && npm run generate:api-types && npm run build:api-types)
fi

echo "Verifying snapshots match generated /openapi/v1.json..."
unset ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT
bash scripts/ci/check_openapi_contract_snapshot.sh

echo "OpenAPI contract snapshot refresh complete."
