#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Summarize real-mode LLM token/cost evidence from gate metrics JSON (Improvement #21).
#>
[CmdletBinding()]
param(
    [string] $MetricsPath = 'artifacts/release/real-llm-last-run-metrics.json',
    [string] $MarkdownOut = 'artifacts/release/real-llm-cost-rollup.md',
    [switch] $FailOnMissing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$metricsAbs = if ([System.IO.Path]::IsPathRooted($MetricsPath)) { $MetricsPath } else { Join-Path $root $MetricsPath }

if (-not (Test-Path -LiteralPath $metricsAbs)) {
    Write-Host "Metrics file not found: $MetricsPath" -ForegroundColor Yellow
    if ($FailOnMissing) { exit 1 }
    exit 0
}

$metrics = Get-Content -LiteralPath $metricsAbs -Raw -Encoding UTF8 | ConvertFrom-Json
$inputTokens = [int]$metrics.inputTokensTotal
$outputTokens = [int]$metrics.outputTokensTotal
$estimatedUsd = $metrics.estimatedCostUsd
$deployment = [string]$metrics.deploymentName
$profile = [string]$metrics.liveEvidenceProfile

$lines = @(
    '# Real-mode LLM cost rollup (generated)',
    '',
    "Generated (UTC): **$((Get-Date).ToUniversalTime().ToString('o'))**",
    '',
    '> Estimates only — not invoice-accurate COGS.',
    '',
    "| Field | Value |",
    '| --- | --- |',
    "| Deployment | $deployment |",
    "| Evidence profile | $profile |",
    "| Input tokens | $inputTokens |",
    "| Output tokens | $outputTokens |",
    "| Estimated USD | $(if ($null -eq $estimatedUsd) { '(not computed)' } else { $estimatedUsd }) |",
    ''
)

$mdAbs = if ([System.IO.Path]::IsPathRooted($MarkdownOut)) { $MarkdownOut } else { Join-Path $root $MarkdownOut }
$dir = Split-Path -Parent $mdAbs
if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

[System.IO.File]::WriteAllText($mdAbs, ($lines -join [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $MarkdownOut" -ForegroundColor Green

if ($FailOnMissing -and (($inputTokens + $outputTokens) -le 0)) {
    Write-Host 'Missing token counts for real-mode evidence.' -ForegroundColor Red
    exit 1
}

exit 0
