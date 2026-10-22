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
$testExitCode = $LASTEXITCODE

$covFiles = @(
  Get-ChildItem -Path .\coverage-gap-1a -Recurse -Filter coverage.cobertura.xml -File -ErrorAction SilentlyContinue
)
if ($covFiles.Count -lt 1) {
  throw "No coverage.cobertura.xml under .\coverage-gap-1a (dotnet test exit $testExitCode). Fix tests or SQL (see docs/COVERAGE_GAP_ANALYSIS.md); for a clean persistence catalog try DROP DATABASE ArchLucidPersistenceTests on your test instance, then re-run."
}

if ($testExitCode -ne 0) {
  Write-Warning "dotnet test exited $testExitCode; merging partial Coverlet shards and refreshing docs/COVERAGE_GAP_ANALYSIS.md anyway."
}

dotnet tool restore
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet reportgenerator "-reports:coverage-gap-1a/**/coverage.cobertura.xml" `
  "-targetdir:coverage-gap-1a/merged" "-reporttypes:Cobertura"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

python scripts/ci/coverage_gap_analysis.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Updated docs/COVERAGE_GAP_ANALYSIS.md"
exit $testExitCode
