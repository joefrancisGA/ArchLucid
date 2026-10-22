#!/usr/bin/env pwsh
<#
.SYNOPSIS
  One-command strict first-pilot path with consolidated evidence index.

.DESCRIPTION
  Runs release-readiness emission (strict RC), first-pilot proof collection hooks,
  and writes a consolidated strict-path summary under artifacts/first-pilot-strict/.

  Default mode is HYBRID (owner decision 2026-06-07): local strict gates
  (config/IaC/claim/verdict) always run with no infrastructure dependency, and
  live Staging probes are added only when an API base URL is supplied via
  -ApiBaseUrl or ARCHLUCID_API_BASE_URL. Staging is the contract-authoritative
  RC environment (docs/library/RC_TARGET_ENVIRONMENT_MATRIX.md) and uses Bearer
  JWT by default (ARCHLUCID_BEARER_TOKEN). When no URL is supplied the summary is
  marked evidenceScope=local-gates-only so it is not mistaken for sponsor-grade
  Staging evidence.
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

# Hybrid default: fall back to the standard API base URL env var so the same
# command attaches live Staging evidence in CI without changing invocation.
if ([string]::IsNullOrWhiteSpace($ApiBaseUrl) -and -not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_API_BASE_URL)) {
    $ApiBaseUrl = $env:ARCHLUCID_API_BASE_URL.Trim()
}

[bool] $hasLiveTarget = -not [string]::IsNullOrWhiteSpace($ApiBaseUrl)
[string] $evidenceScope = if ($hasLiveTarget) { "local-plus-staging-live" } else { "local-gates-only" }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$env:ARCHLUCID_STRICT_RC = "1"
$env:ARCHLUCID_RC_STRICT_CLAIMS = "1"
$env:ARCHLUCID_STRICT_SEND = "1"

try {
    [string] $rcCommitSha = (& git -C $root rev-parse HEAD 2>$null)

    if (-not [string]::IsNullOrWhiteSpace($rcCommitSha)) {
        $env:ARCHLUCID_RC_COMMIT_SHA = $rcCommitSha.Trim()
    }
}
catch {
    # Leave unset when git is unavailable; claim gate treats missing expected SHA as advisory.
}

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
    mode          = "hybrid"
    evidenceScope = $evidenceScope
    apiBaseUrlSet = $hasLiveTarget
    blockers      = $blockers
    artifacts     = @{
        releaseReadiness = $releaseDir
        rcVerdict        = $verdictPath
        deployHandoff    = (Join-Path $releaseDir "deploy-handoff.json")
        testManifest     = (Join-Path $releaseDir "rc-test-evidence-manifest.json")
    }
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $summaryPath -Encoding utf8

Write-Host "First-pilot strict path rollup=$rollup (release exit=$releaseExit)"
Write-Host "Evidence scope: $evidenceScope (mode=hybrid)"

if (-not $hasLiveTarget) {
    Write-Host "No -ApiBaseUrl / ARCHLUCID_API_BASE_URL supplied: local gates only — NOT Staging contract evidence."
}

Write-Host "Summary: $summaryPath"

if ($releaseExit -ne 0 -or $rollup -eq "HOLD") {
    exit 2
}

if ($rollup -eq "WARN") {
    exit 1
}

exit 0
