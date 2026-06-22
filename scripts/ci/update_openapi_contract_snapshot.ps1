# Regenerate the OpenAPI v1 CI baseline snapshot from the live test host.
# Optional downstream client refresh via env flags (see OPENAPI_CONTRACT_DRIFT.md).
#
# Usage (repo root):
#   .\scripts\ci\update_openapi_contract_snapshot.ps1

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $Root

$env:ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT = '1'
& (Join-Path $Root 'scripts/ci/check_openapi_contract_snapshot.ps1')

Write-Host 'Regenerating buyer-tier OpenAPI contract snapshot from live /openapi/v1.json...'
$env:ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT = '1'
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
    --no-build `
    -c Release `
    --filter "FullyQualifiedName~OpenApiBuyerContractSnapshotTests"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Remove-Item Env:ARCHLUCID_UPDATE_BUYER_OPENAPI_SNAPSHOT -ErrorAction SilentlyContinue

Write-Host 'Regenerating ArchLucid.Api.Client (NSwag) from v1 baseline...'
dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($env:ARCHLUCID_REGENERATE_UI_API_TYPES -eq '1') {
    Write-Host 'Regenerating archlucid-ui TypeScript API types...'
    # Prefer npx.cmd on Windows under StrictMode (npx.ps1 can throw on $MyInvocation.Statement).
    $npx = if (Get-Command npx.cmd -ErrorAction SilentlyContinue) { 'npx.cmd' } else { 'npx' }
    Push-Location (Join-Path $Root 'archlucid-ui')
    try {
        & $npx --yes openapi-typescript ../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json `
            -o src/lib/api-types.generated.ts
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    finally {
        Pop-Location
    }
    Write-Host 'Verifying api-types.generated.ts is now in sync...'
    & (Join-Path $Root 'scripts\ci\assert_api_types_in_sync.ps1')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host 'Verifying snapshots match generated /openapi/v1.json...'
Remove-Item Env:ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT -ErrorAction SilentlyContinue
& (Join-Path $Root 'scripts/ci/check_openapi_contract_snapshot.ps1')

Write-Host 'OpenAPI contract snapshot refresh complete.'
