#!/usr/bin/env bash
# Thin master/main push corset: Active solution build + fast-core tests for Core and Decisioning.
# Full corset shards remain on pull_request in ci.yml.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [ -z "${DOTNET_FAST_CORE_TEST_FILTER:-}" ]; then
  echo "::error::DOTNET_FAST_CORE_TEST_FILTER is not set"
  exit 1
fi

dotnet restore ArchLucid.Active.slnf
dotnet build ArchLucid.Active.slnf --no-restore -c Release "/p:SourceRevisionId=$(git rev-parse HEAD)"

for test_project in \
  ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj \
  ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj
do
  dotnet test "$test_project" -c Release --filter "${DOTNET_FAST_CORE_TEST_FILTER}"
done

echo "push-corset-dotnet finished successfully."
