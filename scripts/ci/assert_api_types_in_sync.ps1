# CI guard: ensures the generated TypeScript API types match the current OpenAPI snapshot.
# Regenerates via openapi-typescript and fails on any git diff — merge-blocking.
#
# Usage (repo root):
#   .\scripts\ci\assert_api_types_in_sync.ps1
#
# Remediation on failure:
#   cd archlucid-ui; npm run generate:api-types; cd ..
#   git add archlucid-ui/src/lib/api-types.generated.ts; git commit

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Snapshot = Join-Path $Root 'ArchLucid.Api.Tests\Contracts\openapi-v1.contract.snapshot.json'
$Target = Join-Path $Root 'archlucid-ui\src\lib\api-types.generated.ts'

if (-not (Test-Path $Snapshot)) {
    Write-Error "OpenAPI snapshot not found at: $Snapshot"
    exit 1
}

Write-Host 'Regenerating TypeScript API types from OpenAPI snapshot...'

# Prefer npx.cmd on Windows (npx.ps1 can throw on $MyInvocation.Statement under StrictMode).
$npx = if (Get-Command npx.cmd -ErrorAction SilentlyContinue) { 'npx.cmd' } else { 'npx' }
& $npx --yes openapi-typescript $Snapshot -o $Target
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# git's CRLF-normalization notice on this line-ending-sensitive file writes to stderr, which
# PowerShell treats as a terminating error under $ErrorActionPreference = 'Stop' once captured
# via 2>&1 — relax it for this one native call so only $LASTEXITCODE decides pass/fail.
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$gitDiff = git -C $Root diff --exit-code -- $Target 2>&1
$ErrorActionPreference = $previousErrorActionPreference
if ($LASTEXITCODE -eq 0) {
    Write-Host '✅ api-types.generated.ts is in sync with the OpenAPI snapshot.'
    exit 0
}

Write-Host ''
Write-Host '❌ api-types.generated.ts is out of sync with openapi-v1.contract.snapshot.json.'
Write-Host ''
Write-Host 'Remediation:'
Write-Host '  cd archlucid-ui'
Write-Host '  npm run generate:api-types'
Write-Host '  git add src/lib/api-types.generated.ts; git commit'
Write-Host ''
Write-Host '--- diff (api-types.generated.ts) ---'
git -C $Root diff -- $Target
Write-Host '--- end diff ---'
exit 1
