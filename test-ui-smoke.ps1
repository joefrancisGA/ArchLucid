# 54R — Playwright smoke tests for archiforge-ui (operator shell).
# See docs/TEST_EXECUTION_MODEL.md
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'archiforge-ui')

# Use .cmd shims on Windows so StrictMode does not load npm.ps1 (breaks on $MyInvocation.Statement).
$npm = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }
$npx = if (Get-Command npx.cmd -ErrorAction SilentlyContinue) { 'npx.cmd' } else { 'npx' }

& $npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $npx playwright install --with-deps chromium
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $npm run test:e2e
exit $LASTEXITCODE
