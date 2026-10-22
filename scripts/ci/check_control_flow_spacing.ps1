# Diff-scoped guard: blank line before if/foreach unless first statement in a method.
# Usage (repo root): .\scripts\ci\check_control_flow_spacing.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_control_flow_spacing.py') @args
exit $LASTEXITCODE
