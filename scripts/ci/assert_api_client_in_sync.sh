#!/usr/bin/env bash
# CI guard: ensures NSwag regenerates ArchLucid.Api.Client from the committed OpenAPI snapshot.
# The .g.cs output is gitignored; this check proves generation + compile succeed.
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"

client_path="ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs"

echo "Regenerating ArchLucid.Api.Client (NSwag) from openapi-v1.contract.snapshot.json..."
dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release

if [[ ! -f "$client_path" ]]; then
  echo "❌ $client_path was not produced. Check NSwag.MSBuild restore and nswag.json."
  exit 1
fi

# Guard against an empty or truncated generator run that still exits 0.
line_count="$(wc -l < "$client_path" | tr -d ' ')"
if [[ "$line_count" -lt 1000 ]]; then
  echo "❌ $client_path looks truncated ($line_count lines). Expected a full NSwag client."
  exit 1
fi

echo "✅ $client_path regenerates cleanly from the OpenAPI snapshot ($line_count lines)."
exit 0
