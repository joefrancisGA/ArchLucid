#Requires -Version 7.0
<#
.SYNOPSIS
  Build a LAUNCH_LOAD_DRILL.md "Latest run" table row from k6 --summary-export JSON files.

.PARAMETER SummaryDir
  Directory containing public-showcase-burst-summary.json and authenticated-first-review-burst-summary.json.

.PARAMETER Environment
  Environment label (e.g. staging, local).

.PARAMETER Apply
  When set, replaces the _pending_ row in docs/architecture/LAUNCH_LOAD_DRILL.md.

.PARAMETER WhatIf
  Print the markdown row only.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string] $SummaryDir,

    [string] $Environment = "staging",

    [switch] $Apply,

    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-K6MetricP95Ms {
    param(
        [string] $SummaryPath,
        [string] $MetricName = "http_req_duration"
    )

    if (-not (Test-Path -LiteralPath $SummaryPath)) {
        return $null
    }

    $json = Get-Content -LiteralPath $SummaryPath -Raw | ConvertFrom-Json
    $metric = $json.metrics.$MetricName

    if ($null -eq $metric) {
        return $null
    }

    if ($null -ne $metric.p95) {
        return [math]::Round([double]$metric.p95, 0)
    }

    if ($null -ne $metric.values.'p(95)') {
        return [math]::Round([double]$metric.values.'p(95)', 0)
    }

    return $null
}

function Get-K6FailedRate {
    param([string] $SummaryPath)

    if (-not (Test-Path -LiteralPath $SummaryPath)) {
        return $null
    }

    $json = Get-Content -LiteralPath $SummaryPath -Raw | ConvertFrom-Json
    $metric = $json.metrics.http_req_failed

    if ($null -eq $metric) {
        return $null
    }

    if ($null -ne $metric.rate) {
        return [math]::Round(100.0 * [double]$metric.rate, 2)
    }

    if ($null -ne $metric.values.rate) {
        return [math]::Round(100.0 * [double]$metric.values.rate, 2)
    }

    return $null
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$showcaseSummary = Join-Path $SummaryDir "public-showcase-burst-summary.json"
$authSummary = Join-Path $SummaryDir "authenticated-first-review-burst-summary.json"

$showcaseP95 = Get-K6MetricP95Ms -SummaryPath $showcaseSummary
$authP95 = Get-K6MetricP95Ms -SummaryPath $authSummary
$showcaseErr = Get-K6FailedRate -SummaryPath $showcaseSummary
$authErr = Get-K6FailedRate -SummaryPath $authSummary
$combinedErr = if ($null -ne $showcaseErr -and $null -ne $authErr) { [math]::Max($showcaseErr, $authErr) } elseif ($null -ne $showcaseErr) { $showcaseErr } else { $authErr }

$date = (Get-Date).ToString("yyyy-MM-dd")
$showcaseP95Text = if ($null -ne $showcaseP95) { "$showcaseP95" } else { "—" }
$authP95Text = if ($null -ne $authP95) { "$authP95" } else { "—" }
$errText = if ($null -ne $combinedErr) { "$combinedErr%" } else { "—" }

$row = "| $date | $Environment | 50 | $showcaseP95Text | $errText | 15 | $authP95Text | TB-905; summaries in ``$SummaryDir`` |"

Write-Host $row

if ($WhatIf -or -not $Apply) {
    exit 0
}

$launchDrillPath = Join-Path $repoRoot "docs" "architecture" "LAUNCH_LOAD_DRILL.md"
$content = Get-Content -LiteralPath $launchDrillPath -Raw -Encoding utf8
$pendingRow = '| _pending_ | local/staging | — | — | — | — | — | Scripts shipped 2026-07-11; first measured run pending owner traffic-sizing input |'

if (-not $content.Contains($pendingRow)) {
    Write-Warning "No _pending_ row found in LAUNCH_LOAD_DRILL.md — append manually:"
    Write-Host $row
    exit 1
}

$newContent = $content.Replace($pendingRow, $row)

if ($PSCmdlet.ShouldProcess($launchDrillPath, "Replace pending launch load drill row")) {
    Set-Content -LiteralPath $launchDrillPath -Value $newContent -Encoding utf8 -NoNewline
    Write-Host "Updated $launchDrillPath"
}
