#!/usr/bin/env bash
# Regenerate buyer-contract.openapi.snapshot.json from openapi-v1.contract.snapshot.json.
# Same filter as OpenApiBuyerContractSnapshotTests (offline path via generate_buyer_openapi_snapshot.py).
#
# Usage (repo root):
#   bash scripts/ci/update_buyer_openapi_contract_snapshot.sh
#
# Live-host refresh (matches CI assertion exactly):
#   ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT=1 dotnet test --filter OpenApiBuyerContractSnapshotTests

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

python3 scripts/ci/generate_buyer_openapi_snapshot.py

dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --no-build \
  -c Release \
  --filter "FullyQualifiedName~OpenApiBuyerContractSnapshotTests"

echo "Buyer OpenAPI contract snapshot refresh complete."
