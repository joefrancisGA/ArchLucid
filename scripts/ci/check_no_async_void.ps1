# Diff-scoped guard: block `async void` in changed C#.
# Usage (repo root): .\scripts\ci\check_no_async_void.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_no_async_void.py') @args
exit $LASTEXITCODE
