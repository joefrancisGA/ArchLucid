# Diff-scoped guard: ban `throw new Exception` in changed C#.
# Usage (repo root): .\scripts\ci\check_no_base_exception.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_no_base_exception.py') @args
exit $LASTEXITCODE
