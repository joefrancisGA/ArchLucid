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

if ($env:ARCHLUCID_REGENERATE_UI_API_TYPES -eq '1') {
    Write-Host 'Regenerating archlucid-ui TypeScript API types...'
    # Prefer npx.cmd on Windows under StrictMode (npx.ps1 can throw on $MyInvocation.Statement).
    $npx = if (Get-Command npx.cmd -ErrorAction SilentlyContinue) { 'npx.cmd' } else { 'npx' }
    Push-Location (Join-Path $Root 'archlucid-ui')
    try {
        & $npx openapi-typescript ../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json `
            -o src/lib/api-types.generated.ts
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    finally {
        Pop-Location
    }
}

if ($env:ARCHLUCID_REGENERATE_DOTNET_CLIENT -eq '1') {
    Write-Host 'Regenerating ArchLucid.Api.Client (NSwag)...'
    dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj -c Release
}

Write-Host 'Verifying snapshot matches generated /openapi/v1.json...'
Remove-Item Env:ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT -ErrorAction SilentlyContinue
& (Join-Path $Root 'scripts/ci/check_openapi_contract_snapshot.ps1')

Write-Host 'OpenAPI contract snapshot refresh complete.'
