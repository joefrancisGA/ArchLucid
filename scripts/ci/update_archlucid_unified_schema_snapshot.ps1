# Regenerate ArchLucid_Unified_Schema.sql from ArchLucid.sql.
# Usage (repo root): pwsh ./scripts/ci/update_archlucid_unified_schema_snapshot.ps1

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $Root

python (Join-Path $PSScriptRoot 'build_archlucid_unified_schema_sql.py')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
