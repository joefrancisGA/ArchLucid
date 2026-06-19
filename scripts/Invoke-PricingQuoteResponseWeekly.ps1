#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Generate weekly pricing quote response telemetry JSON + Markdown for owner review.

.DESCRIPTION
  Wraps scripts/ci/report_pricing_quote_response_weekly.py. Uses fixture input by default;
  set ARCHLUCID_PRICING_QUOTE_TELEMETRY_SQL for production/staging ODBC reads.

.PARAMETER OutDir
  Output directory root (default: artifacts/pricing-quote-response).

.PARAMETER InputJson
  Optional export fixture path (default: fixtures/pricing-quote-response/sample-quote-requests.json).

.PARAMETER Strict
  Exit 1 when weeklyDisposition is HOLD.
#>
[CmdletBinding()]
param(
    [string] $OutDir = 'artifacts/pricing-quote-response',
    [string] $InputJson = 'fixtures/pricing-quote-response/sample-quote-requests.json',
    [switch] $Strict
)

$ErrorActionPreference = 'Stop'
[string] $root = Split-Path -Parent $PSScriptRoot
Set-Location $root

[string] $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
[string] $outputDir = Join-Path $OutDir $stamp
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

[string] $jsonOut = Join-Path $outputDir 'weekly-summary.json'
[string] $markdownOut = Join-Path $outputDir 'weekly-summary.md'

[string[]] $pythonArgs = @(
    'scripts/ci/report_pricing_quote_response_weekly.py',
    '--json-out', $jsonOut,
    '--markdown-out', $markdownOut
)

if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_PRICING_QUOTE_TELEMETRY_SQL)) {
    Write-Host 'Using ARCHLUCID_PRICING_QUOTE_TELEMETRY_SQL for quote request telemetry.'
}
elseif (Test-Path -LiteralPath $InputJson) {
    $pythonArgs += @('--input-json', $InputJson)
}
else {
    throw "Fixture not found at $InputJson and ARCHLUCID_PRICING_QUOTE_TELEMETRY_SQL is unset."
}

if ($Strict) {
    $pythonArgs += '--strict'
}

& python @pythonArgs
[int] $exitCode = $LASTEXITCODE

Write-Host "Weekly pricing quote telemetry: $jsonOut"

if ($exitCode -ne 0) {
    exit $exitCode
}

exit 0
