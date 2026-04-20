# Legacy shim: delegates to test.ps1 -Tier SqlServerIntegration. See docs/TEST_EXECUTION_MODEL.md.
# Set ARCHLUCID_SQL_TEST to a full SQL connection string before running.
# This script will be retired after 2026-Q3; new docs/runbooks should call .\test.ps1 -Tier SqlServerIntegration directly.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $root 'test.ps1') -Tier SqlServerIntegration
exit $LASTEXITCODE
