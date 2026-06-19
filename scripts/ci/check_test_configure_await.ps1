# Fail when test projects use ConfigureAwait(false).
# Usage (repo root): .\scripts\ci\check_test_configure_await.ps1

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_test_configure_await.py')
exit $LASTEXITCODE
