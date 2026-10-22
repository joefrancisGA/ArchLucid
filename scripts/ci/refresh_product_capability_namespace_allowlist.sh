#!/usr/bin/env bash
# Regenerate docs/architecture/data/product-capability-namespace-allowlist.json from current violations.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PATH="${HOME}/.dotnet:${PATH}"
export ARCHLUCID_REFRESH_CAPABILITY_ALLOWLIST=1

dotnet test "${REPO_ROOT}/ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj" \
  --filter 'FullyQualifiedName~Refresh_namespace_allowlist_snapshot' \
  -c Release \
  -v q

echo "Wrote docs/architecture/data/product-capability-namespace-allowlist.json"
