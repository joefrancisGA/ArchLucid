#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Runs lightweight checks useful for a release evidence pack (continues on failure; inspect output).
#>
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "== ArchLucid release evidence summary (local) ==" -ForegroundColor Cyan

Write-Host "`n[dotnet build Release]" -ForegroundColor Yellow
dotnet build .\ArchLucid.sln -c Release
if ($LASTEXITCODE -ne 0) { Write-Warning "Build failed (exit $LASTEXITCODE)" }

Write-Host "`n[OpenAPI snapshot test]" -ForegroundColor Yellow
dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~OpenApiContractSnapshot" --no-build
if ($LASTEXITCODE -ne 0) { Write-Warning "OpenAPI snapshot test failed (exit $LASTEXITCODE)" }

Write-Host "`n[Health-related API tests (sample)]" -ForegroundColor Yellow
dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~Health" --no-build
if ($LASTEXITCODE -ne 0) { Write-Warning "Health tests failed (exit $LASTEXITCODE)" }

Write-Host "`nDone. Review warnings above; see docs/library/RELEASE_EVIDENCE_SUMMARY.md" -ForegroundColor Green
