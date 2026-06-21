# Build ArchLucid.Api.Tests and verify OpenAPI v1 and buyer-tier snapshots match CI baselines.
# Same assertion as CI job "openapi-contract-snapshot".
#
# Usage (from repo root):
#   .\scripts\ci\check_openapi_contract_snapshot.ps1

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $Root

dotnet restore ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj

$rev = 'local'
try { $rev = (git rev-parse HEAD).Trim() }
catch { }

dotnet build ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
    --no-restore `
    -c Release `
    "/p:SourceRevisionId=$rev"

dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
    --no-build `
    -c Release `
    --filter "FullyQualifiedName~OpenApiContractSnapshotTests"

# Buyer snapshot is refreshed in a separate step during v1-only baseline updates.
if ($env:ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT -ne '1') {
    dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
        --no-build `
        -c Release `
        --filter "FullyQualifiedName~OpenApiBuyerContractSnapshotTests"
}
