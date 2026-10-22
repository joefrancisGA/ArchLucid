# Diff-scoped guard: block Console.Write / Console.WriteLine in product C# (not tests/CLI/benchmarks).
# Usage (repo root): .\scripts\ci\check_no_console_writeline.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_no_console_writeline.py') @args
exit $LASTEXITCODE
