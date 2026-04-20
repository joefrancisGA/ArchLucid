# Legacy shim: delegates to test.ps1 -Tier Core. See docs/TEST_EXECUTION_MODEL.md.
# This script will be retired after 2026-Q3; new docs/runbooks should call .\test.ps1 -Tier Core directly.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $root 'test.ps1') -Tier Core
exit $LASTEXITCODE
