# 54R — Vitest unit tests for archlucid-ui (operator shell).
# See docs/TEST_EXECUTION_MODEL.md
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'archlucid-ui')

# Use .cmd shims on Windows so StrictMode does not load npm.ps1 (breaks on $MyInvocation.Statement).
$npm = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }

& $npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $npm run test
exit $LASTEXITCODE
