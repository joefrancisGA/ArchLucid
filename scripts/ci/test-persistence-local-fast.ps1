# Fast local check for ArchLucid.Persistence.Tests — no Coverlet.
# Strict merged + per-package line gates run in CI (job dotnet-full-regression); see docs/COVERAGE_GAP_ANALYSIS.md.
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
& dotnet test (Join-Path $root 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj') -c Release @args
