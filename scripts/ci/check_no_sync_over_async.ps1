# Diff-scoped guard: block sync-over-async in product C#.
# Usage (repo root): .\scripts\ci\check_no_sync_over_async.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_no_sync_over_async.py') @args
exit $LASTEXITCODE
