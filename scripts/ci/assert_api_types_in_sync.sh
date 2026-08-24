#!/usr/bin/env bash
# CI guard: ensures the generated TypeScript API types match the current OpenAPI snapshot.
# Regenerates via split generator and fails on any git diff — merge-blocking.
#
# Usage (repo root):
#   bash scripts/ci/assert_api_types_in_sync.sh
#
# Remediation on failure:
#   cd archlucid-ui && npm run generate:api-types && cd ..
#   git add archlucid-ui/src/lib/api-types/ archlucid-ui/src/lib/api-types.generated.ts && git commit

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SNAPSHOT="${ROOT}/ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json"
TARGET_DIR="${ROOT}/archlucid-ui/src/lib/api-types"
BARREL="${ROOT}/archlucid-ui/src/lib/api-types.generated.ts"

if [ ! -f "${SNAPSHOT}" ]; then
  echo "❌ OpenAPI snapshot not found at: ${SNAPSHOT}"
  exit 1
fi

echo "Regenerating TypeScript API types from OpenAPI snapshot..."
(cd "${ROOT}/archlucid-ui" && npm run generate:api-types)

if git -C "${ROOT}" diff --exit-code -- "${TARGET_DIR}" "${BARREL}" > /dev/null 2>&1; then
  echo "✅ Split api-types output is in sync with the OpenAPI snapshot."
  exit 0
fi

echo ""
echo "❌ Generated api-types are out of sync with openapi-v1.contract.snapshot.json."
echo ""
echo "Remediation:"
echo "  cd archlucid-ui"
echo "  npm run generate:api-types"
echo "  git add src/lib/api-types/ src/lib/api-types.generated.ts && git commit"
echo ""
echo "--- diff (api-types) ---"
git -C "${ROOT}" diff -- "${TARGET_DIR}" "${BARREL}"
echo "--- end diff ---"
exit 1
