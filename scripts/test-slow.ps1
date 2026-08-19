# Legacy shim: delegates to test.ps1 -Tier Slow. See docs/TEST_EXECUTION_MODEL.md.
# This script will be retired after 2026-Q3; new docs/runbooks should call .\scripts\test.ps1 -Tier Slow directly.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'test.ps1') -Tier Slow
exit $LASTEXITCODE
