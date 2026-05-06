#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Runs optional RealAzureOpenAIEndToEndTests when ARCHLUCID_REAL_AOAI_TEST_* env vars are set; otherwise exits 0 (skip).
#>
$endpoint = $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT
$key = $env:ARCHLUCID_REAL_AOAI_TEST_KEY

if ([string]::IsNullOrWhiteSpace($endpoint) -or [string]::IsNullOrWhiteSpace($key)) {
    Write-Host "SKIP: Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY to run live AOAI evidence gate."
    exit 0
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Running RealAzureOpenAIEndToEndTests..." -ForegroundColor Cyan
dotnet test .\ArchLucid.AgentRuntime.Tests\ArchLucid.AgentRuntime.Tests.csproj `
    --filter "FullyQualifiedName~RealAzureOpenAIEndToEndTests" `
    --no-build:$false

exit $LASTEXITCODE
