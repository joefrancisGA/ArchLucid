# Enforce one consolidated DDL file per database under ArchLucid.Persistence/Scripts.
# Usage (repo root): .\scripts\ci\check_single_ddl_file.ps1

$ErrorActionPreference = 'Stop'
$Python = $env:ARCHLUCID_PYTHON

if (-not $Python) {
    $Python = 'python'
}

& $Python (Join-Path $PSScriptRoot 'check_single_ddl_file.py')
exit $LASTEXITCODE
