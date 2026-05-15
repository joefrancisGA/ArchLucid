# Regenerate docs/COVERAGE_GAP_ANALYSIS.md from a clean Coverlet + ReportGenerator merge.
# For CI-identical numbers use: gh run download <id> -n coverage-merged-cobertura -D .\ci-coverage
# then: python scripts/ci/coverage_gap_analysis.py --cobertura .\ci-coverage\Cobertura.xml
#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

Remove-Item -Recurse -Force .\coverage-gap-1a -ErrorAction SilentlyContinue

dotnet test ArchLucid.sln -c Release --settings coverage.runsettings `
  --collect:"XPlat Code Coverage" --results-directory .\coverage-gap-1a
if ($LASTEXITCODE -ne 0) {
  Write-Error "dotnet test failed with exit code $LASTEXITCODE - fix tests or set ARCHLUCID_SQL_TEST for SQL-backed coverage (see docs/library/CODE_COVERAGE.md)."
}

dotnet tool restore
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet reportgenerator "-reports:coverage-gap-1a/**/coverage.cobertura.xml" `
  "-targetdir:coverage-gap-1a/merged" "-reporttypes:Cobertura"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

python scripts/ci/coverage_gap_analysis.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Updated docs/COVERAGE_GAP_ANALYSIS.md"
