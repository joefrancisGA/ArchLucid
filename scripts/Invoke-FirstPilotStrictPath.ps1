#!/usr/bin/env pwsh
<#
.SYNOPSIS
  One-command strict first-pilot path with consolidated evidence index.

.DESCRIPTION
  Runs release-readiness emission (strict RC), first-pilot proof collection hooks,
  and writes a consolidated strict-path summary under artifacts/first-pilot-strict/.
#>
[CmdletBinding()]
param(
    [string] $OutDir = "artifacts/first-pilot-strict",
    [string] $ApiBaseUrl = "",
    [string] $RunId = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$env:ARCHLUCID_STRICT_RC = "1"
$env:ARCHLUCID_RC_STRICT_CLAIMS = "1"
$env:ARCHLUCID_STRICT_SEND = "1"

$releaseDir = Join-Path $OutDir "release-readiness"
$releaseArgs = @(
    "-NoProfile",
    "-File",
    (Join-Path $root "scripts/Emit-ReleaseReadinessEvidence.ps1"),
    "-OutDir",
    $releaseDir,
    "-StrictRc"
)

if (-not [string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    $releaseArgs += @("-ApiBaseUrl", $ApiBaseUrl)
}

& pwsh @releaseArgs
[int] $releaseExit = $LASTEXITCODE

$summaryPath = Join-Path $OutDir "first-pilot-strict-summary.json"
$verdictPath = Join-Path $releaseDir "rc-go-no-go-verdict.json"
$verdict = $null

if (Test-Path -LiteralPath $verdictPath) {
    $verdict = Get-Content -LiteralPath $verdictPath -Raw | ConvertFrom-Json
}

$rollup = if ($verdict) { [string]$verdict.verdict } else { "HOLD" }
$blockers = @()

if ($verdict -and $verdict.blockers) {
    $blockers = @($verdict.blockers)
}

[ordered]@{
    schema        = "archlucid.first-pilot-strict-path.v1"
    generatedUtc  = [DateTime]::UtcNow.ToString("o")
    rollup        = $rollup
    releaseExit   = $releaseExit
    runId         = $RunId
    blockers      = $blockers
    artifacts     = @{
        releaseReadiness = $releaseDir
        rcVerdict        = $verdictPath
        deployHandoff    = (Join-Path $releaseDir "deploy-handoff.json")
        testManifest     = (Join-Path $releaseDir "rc-test-evidence-manifest.json")
    }
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $summaryPath -Encoding utf8

Write-Host "First-pilot strict path rollup=$rollup (release exit=$releaseExit)"
Write-Host "Summary: $summaryPath"

if ($releaseExit -ne 0 -or $rollup -eq "HOLD") {
    exit 2
}

if ($rollup -eq "WARN") {
    exit 1
}

exit 0
