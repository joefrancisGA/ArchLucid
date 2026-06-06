#!/usr/bin/env bash
# CI guard: ensures NSwag output matches the committed OpenAPI snapshot.
# Regenerates ArchLucid.Api.Client and fails if Generated/ArchLucidApiClient.g.cs drifts.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"

echo "Regenerating ArchLucid.Api.Client (NSwag) from openapi-v1.contract.snapshot.json..."
dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release

client_path="ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs"

if git diff --exit-code -- "$client_path" > /dev/null 2>&1; then
  echo "✅ $client_path is in sync with the OpenAPI snapshot."
  exit 0
fi

echo "❌ $client_path is out of sync. Run:"
echo "   dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release"
echo "   then commit the regenerated file."
git diff -- "$client_path" | head -80
exit 1
