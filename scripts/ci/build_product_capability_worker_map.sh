#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

export ARCHLUCID_REFRESH_WORKER_CAPABILITY_MAP=1
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj \
  -c Release \
  --filter "FullyQualifiedName~Refresh_worker_capability_map_snapshot" \
  --no-restore
