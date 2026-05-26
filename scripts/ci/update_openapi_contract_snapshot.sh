#!/usr/bin/env bash
# Regenerate the committed OpenAPI v1 contract snapshot from the live test host.
# Optional downstream client refresh via env flags (see OPENAPI_CONTRACT_DRIFT.md).
#
# Usage (repo root):
#   bash scripts/ci/update_openapi_contract_snapshot.sh
#
# Optional:
#   ARCHLUCID_REGENERATE_UI_API_TYPES=1   — refresh archlucid-ui api-types.generated.ts
#   ARCHLUCID_REGENERATE_DOTNET_CLIENT=1  — rebuild ArchLucid.Api.Client (NSwag from snapshot)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1
bash scripts/ci/check_openapi_contract_snapshot.sh

if [ "${ARCHLUCID_REGENERATE_UI_API_TYPES:-0}" = "1" ]; then
  echo "Regenerating archlucid-ui TypeScript API types..."
  cd "${ROOT}/archlucid-ui"
  npx openapi-typescript ../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json \
    -o src/lib/api-types.generated.ts
  cd "$ROOT"
fi

if [ "${ARCHLUCID_REGENERATE_DOTNET_CLIENT:-0}" = "1" ]; then
  echo "Regenerating ArchLucid.Api.Client (NSwag)..."
  dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release
fi

echo "Verifying snapshot matches generated /openapi/v1.json..."
unset ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT
bash scripts/ci/check_openapi_contract_snapshot.sh

echo "OpenAPI contract snapshot refresh complete."
