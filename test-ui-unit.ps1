# 54R — Vitest unit tests for archiforge-ui (operator shell).
# See docs/TEST_EXECUTION_MODEL.md
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'archiforge-ui')
npm ci
npm run test
exit $LASTEXITCODE
