# CI guard: ensures the generated TypeScript API types match the current OpenAPI snapshot.
# Regenerates via split generator and fails on any git diff — merge-blocking.
#
# Usage (repo root):
#   .\scripts\ci\assert_api_types_in_sync.ps1
#
# Remediation on failure:
#   cd archlucid-ui; npm run generate:api-types; cd ..
#   git add archlucid-ui/src/lib/api-types/ archlucid-ui/src/lib/api-types.generated.ts; git commit

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Snapshot = Join-Path $Root 'ArchLucid.Api.Tests\Contracts\openapi-v1.contract.snapshot.json'
$TargetDir = Join-Path $Root 'archlucid-ui\src\lib\api-types'
$Barrel = Join-Path $Root 'archlucid-ui\src\lib\api-types.generated.ts'

if (-not (Test-Path $Snapshot)) {
    Write-Error "OpenAPI snapshot not found at: $Snapshot"
    exit 1
}

Write-Host 'Regenerating TypeScript API types from OpenAPI snapshot...'
Push-Location (Join-Path $Root 'archlucid-ui')
try {
    npm run generate:api-types
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

$ErrorActionPreference = 'Continue'
$gitDiff = git -C $Root diff --exit-code -- $TargetDir $Barrel 2>&1
$ErrorActionPreference = $previousErrorActionPreference
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host '❌ Generated api-types are out of sync with openapi-v1.contract.snapshot.json.'
    Write-Host ''
    Write-Host 'Remediation:'
    Write-Host '  cd archlucid-ui'
    Write-Host '  npm run generate:api-types'
    Write-Host '  git add src/lib/api-types/ src/lib/api-types.generated.ts; git commit'
    Write-Host ''
    Write-Host '--- diff (api-types) ---'
    git -C $Root diff -- $TargetDir $Barrel
    Write-Host '--- end diff ---'
    exit 1
}

$PackageDir = Join-Path $Root 'archlucid-ui\packages\api-types\src\api-types'
$SyncScript = Join-Path $Root 'archlucid-ui\packages\api-types\scripts\sync-from-ui.mjs'

Write-Host 'Syncing @archlucid/api-types from UI source...'
node $SyncScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$packageDiff = git -C $Root diff --exit-code -- $PackageDir 2>&1
$ErrorActionPreference = $previousErrorActionPreference
if ($LASTEXITCODE -eq 0) {
    Write-Host '✅ Split api-types output is in sync with the OpenAPI snapshot.'
    Write-Host '✅ @archlucid/api-types package copy matches src/lib/api-types.'
    exit 0
}

Write-Host ''
Write-Host '❌ @archlucid/api-types is out of sync with src/lib/api-types.'
Write-Host ''
Write-Host 'Remediation:'
Write-Host '  cd archlucid-ui'
Write-Host '  npm run build:api-types'
Write-Host '  git add packages/api-types/src/api-types/; git commit'
Write-Host ''
Write-Host '--- diff (packages/api-types) ---'
git -C $Root diff -- $PackageDir
Write-Host '--- end diff ---'
exit 1
