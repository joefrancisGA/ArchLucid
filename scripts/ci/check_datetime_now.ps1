# Diff-scoped guard: ban DateTime.Now / DateTime.Today in changed product C#.
# Usage (repo root): .\scripts\ci\check_datetime_now.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_datetime_now.py') @args
exit $LASTEXITCODE
