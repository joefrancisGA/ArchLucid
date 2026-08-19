# Diff-scoped guard: one root-level class/record/struct per .cs file.
# Usage (repo root): .\scripts\ci\check_single_class_per_file.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_single_class_per_file.py') @args
exit $LASTEXITCODE
