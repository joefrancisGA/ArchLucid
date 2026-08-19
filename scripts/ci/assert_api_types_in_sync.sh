#!/usr/bin/env bash
# CI guard: ensures the generated TypeScript API types match the current OpenAPI snapshot.
# Regenerates via openapi-typescript and fails on any git diff — merge-blocking.
#
# Usage (repo root):
#   bash scripts/ci/assert_api_types_in_sync.sh
#
# Remediation on failure:
#   cd archlucid-ui && npm run generate:api-types && cd ..
#   git add archlucid-ui/src/lib/api-types.generated.ts && git commit

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SNAPSHOT="${ROOT}/ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json"
TARGET="${ROOT}/archlucid-ui/src/lib/api-types.generated.ts"

if [ ! -f "${SNAPSHOT}" ]; then
  echo "❌ OpenAPI snapshot not found at: ${SNAPSHOT}"
  exit 1
fi

echo "Regenerating TypeScript API types from OpenAPI snapshot..."
npx --yes openapi-typescript "${SNAPSHOT}" -o "${TARGET}"

if git -C "${ROOT}" diff --exit-code -- "${TARGET}" > /dev/null 2>&1; then
  echo "✅ api-types.generated.ts is in sync with the OpenAPI snapshot."
  exit 0
fi

echo ""
echo "❌ api-types.generated.ts is out of sync with openapi-v1.contract.snapshot.json."
echo ""
echo "Remediation:"
echo "  cd archlucid-ui"
echo "  npm run generate:api-types"
echo "  git add src/lib/api-types.generated.ts && git commit"
echo ""
echo "--- diff (api-types.generated.ts) ---"
git -C "${ROOT}" diff -- "${TARGET}"
echo "--- end diff ---"
exit 1
