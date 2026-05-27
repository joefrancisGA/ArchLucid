# Fail when ArchLucid_Unified_Schema.sql drifts from generator output.
# Usage (repo root): pwsh ./scripts/ci/check_archlucid_unified_schema_snapshot.ps1

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $Root

python (Join-Path $PSScriptRoot 'check_archlucid_unified_schema_snapshot.py')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
