#Requires -Version 7.0
<#
.SYNOPSIS
  Build a SCALE_MICRO_DRILL.md results table row from k6 summary JSON (and optional replica observations).

.PARAMETER SummaryDir
  Directory containing scale-drill-*-summary.json files.

.PARAMETER Apply
  When set, replaces the _pending_ row in docs/architecture/SCALE_MICRO_DRILL.md.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string] $SummaryDir,

    [string] $Environment = "staging",

    [Nullable[int]] $DrillAReplicasObserved,
    [string] $DrillADominantRule,
    [Nullable[int]] $DrillBReplicasObserved,
    [string] $DrillBDominantRule,
    [string] $DrillCStatus = "—",

    [switch] $Apply,

    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-K6MetricP95Ms {
    param([string] $SummaryPath)

    if (-not (Test-Path -LiteralPath $SummaryPath)) {
        return $null
    }

    $json = Get-Content -LiteralPath $SummaryPath -Raw | ConvertFrom-Json
    $metric = $json.metrics.http_req_duration

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

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$aSummary = Join-Path $SummaryDir "scale-drill-a-summary.json"
$bSummary = Join-Path $SummaryDir "scale-drill-b-summary.json"

$aP95 = Get-K6MetricP95Ms -SummaryPath $aSummary
$bP95 = Get-K6MetricP95Ms -SummaryPath $bSummary

$date = (Get-Date).ToString("yyyy-MM-dd")
$aReplicasText = if ($null -ne $DrillAReplicasObserved) { "$DrillAReplicasObserved" } else { "—" }
$aRuleText = if ($DrillADominantRule) { $DrillADominantRule } else { "—" }
$bReplicasText = if ($null -ne $DrillBReplicasObserved) { "$DrillBReplicasObserved" } else { "—" }
$bRuleText = if ($DrillBDominantRule) { $DrillBDominantRule } else { "—" }
$aP95Text = if ($null -ne $aP95) { "$aP95" } else { "—" }
$bP95Text = if ($null -ne $bP95) { "$bP95" } else { "—" }

$row = "| $date | $Environment | $aReplicasText | $aRuleText | $aP95Text | $bReplicasText | $bRuleText | $bP95Text | $DrillCStatus | TB-946; summaries in ``$SummaryDir`` |"

Write-Host $row

if ($WhatIf -or -not $Apply) {
    exit 0
}

$drillPath = Join-Path $repoRoot "docs" "architecture" "SCALE_MICRO_DRILL.md"
$content = Get-Content -LiteralPath $drillPath -Raw -Encoding utf8
$pendingRow = '| _pending_ | staging | — | — | — | — | — | — | — | Harness shipped **TB-946**; owner staging run pending **G-SCALE-01** |'

if (-not $content.Contains($pendingRow)) {
    Write-Warning "No _pending_ row found in SCALE_MICRO_DRILL.md — append manually:"
    Write-Host $row
    exit 1
}

$newContent = $content.Replace($pendingRow, $row)

if ($PSCmdlet.ShouldProcess($drillPath, "Replace pending scale micro-drill row")) {
    Set-Content -LiteralPath $drillPath -Value $newContent -Encoding utf8 -NoNewline
    Write-Host "Updated $drillPath"
}
