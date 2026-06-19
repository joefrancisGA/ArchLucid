# Diff-scoped guard: prefer `is null` / `is not null` over == null / != null in changed C#.
# Usage (repo root): .\scripts\ci\check_csharp_is_null.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_csharp_is_null.py') @args
exit $LASTEXITCODE
