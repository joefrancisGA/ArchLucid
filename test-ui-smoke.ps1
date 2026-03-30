# 54R — Playwright smoke tests for archiforge-ui (operator shell).
# See docs/TEST_EXECUTION_MODEL.md
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'archiforge-ui')
npm ci
npx playwright install chromium
npm run test:e2e
exit $LASTEXITCODE
