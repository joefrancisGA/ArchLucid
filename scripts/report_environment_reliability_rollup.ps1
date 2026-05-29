#requires -Version 5.1
<#
.SYNOPSIS
  Buyer-safe environment reliability rollup for first-pilot proof (health, data, telemetry, AI gate, LLM budget, timing).
#>
param(
    [Parameter(Mandatory = $true)][string] $ProofDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-JsonFileIfPresent {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -ErrorAction Stop
}

function Add-RollupRow {
    param(
        [Parameter(Mandatory = $true)][System.Collections.Generic.List[object]] $Rows,
        [Parameter(Mandatory = $true)][string] $Signal,
        [Parameter(Mandatory = $true)][ValidateSet('PASS', 'WARN', 'HOLD')][string] $Disposition,
        [Parameter(Mandatory = $true)][string] $Summary,
        [Parameter(Mandatory = $true)][string] $Remediation
    )

    $Rows.Add([ordered]@{
        signal      = $Signal
        disposition = $Disposition
        summary     = $Summary
        remediation = $Remediation
    })
}

$rows = [System.Collections.Generic.List[object]]::new()
$proofDir = $ProofDirectory

$dataSummary = Read-JsonFileIfPresent -Path (Join-Path $proofDir 'data-consistency-readiness/data-consistency-summary.json')

if ($null -eq $dataSummary) {
    Add-RollupRow -Rows $rows -Signal 'data-consistency' -Disposition 'WARN' -Summary 'Data-consistency summary not attached.' -Remediation 'Run collect-data-consistency-readiness.ps1 without -SkipDataConsistency.'
}
else {
    $holdCount = @($dataSummary.probes | Where-Object { [string]$_.status -eq 'HOLD' }).Count
    $warnCount = @($dataSummary.probes | Where-Object { [string]$_.status -eq 'WARN' }).Count

    if ($holdCount -gt 0) {
        Add-RollupRow -Rows $rows -Signal 'data-consistency' -Disposition 'HOLD' -Summary "$holdCount data-consistency probe(s) on HOLD." -Remediation 'Resolve HOLD probes in data-consistency-summary.json before sponsor handoff.'
    }
    elseif ($warnCount -gt 0) {
        Add-RollupRow -Rows $rows -Signal 'data-consistency' -Disposition 'WARN' -Summary "$warnCount data-consistency probe(s) on WARN." -Remediation 'Review WARN probes before external circulation.'
    }
    else {
        Add-RollupRow -Rows $rows -Signal 'data-consistency' -Disposition 'PASS' -Summary 'Data-consistency probes passed.' -Remediation ''
    }
}

$telemetry = Read-JsonFileIfPresent -Path (Join-Path $proofDir 'observability-export-readiness.json')

if ($null -eq $telemetry) {
    Add-RollupRow -Rows $rows -Signal 'telemetry-export' -Disposition 'WARN' -Summary 'Telemetry export readiness artifact missing.' -Remediation 'Run report_observability_export_readiness.py via proof pipeline.'
}
else {
    $verdict = [string]$telemetry.verdict

    if ($verdict -eq 'PASS') {
        Add-RollupRow -Rows $rows -Signal 'telemetry-export' -Disposition 'PASS' -Summary "Telemetry export readiness is $verdict." -Remediation ''
    }
    elseif ($verdict -eq 'HOLD') {
        Add-RollupRow -Rows $rows -Signal 'telemetry-export' -Disposition 'HOLD' -Summary "Telemetry export readiness is $verdict." -Remediation 'Configure Application Insights or OTLP before hosted sponsor handoff.'
    }
    else {
        Add-RollupRow -Rows $rows -Signal 'telemetry-export' -Disposition 'WARN' -Summary "Telemetry export readiness is $verdict." -Remediation 'Review observability-export-readiness.md.'
    }
}

$aiGate = Read-JsonFileIfPresent -Path (Join-Path $proofDir 'ai-readiness-gate.json')

if ($null -eq $aiGate) {
    Add-RollupRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'WARN' -Summary 'Consolidated AI readiness gate not emitted.' -Remediation 'Rerun collect-first-pilot-proof.ps1 with -RunId for committed-run evidence.'
}
else {
    $gateDisposition = [string]$aiGate.disposition

    if ($gateDisposition -eq 'PASS') {
        Add-RollupRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'PASS' -Summary 'AI readiness gate passed.' -Remediation ''
    }
    elseif ($gateDisposition -eq 'HOLD') {
        Add-RollupRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'HOLD' -Summary 'AI readiness gate is HOLD for sponsor-grade real-mode evidence.' -Remediation 'Resolve HOLD rows in ai-readiness-gate.md before sponsor send on real-mode hosts.'
    }
    else {
        Add-RollupRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'WARN' -Summary "AI readiness gate disposition is $gateDisposition." -Remediation 'Review ai-readiness-gate.md.'
    }
}

$llmBudget = Read-JsonFileIfPresent -Path (Join-Path $proofDir 'llm-budget-proof-status.json')

if ($null -eq $llmBudget) {
    Add-RollupRow -Rows $rows -Signal 'llm-budget' -Disposition 'WARN' -Summary 'LLM budget proof status not attached.' -Remediation 'Collect committed-run evidence with -RunId.'
}
else {
    $budgetStatus = [string]$llmBudget.status
    Add-RollupRow -Rows $rows -Signal 'llm-budget' -Disposition 'PASS' -Summary "LLM budget posture recorded (status=$budgetStatus)." -Remediation ''
}

$timing = Read-JsonFileIfPresent -Path (Join-Path $proofDir 'first-pilot-timing-budget.json')

if ($null -eq $timing) {
    Add-RollupRow -Rows $rows -Signal 'timing-budget' -Disposition 'WARN' -Summary 'First-pilot timing budget artifact missing.' -Remediation 'Rerun collect-first-pilot-proof.ps1 to emit first-pilot-timing-budget.json.'
}
else {
    $measured = @($timing.phases | Where-Object { [string]$_.collectionStatus -eq 'measured' }).Count

    if ($measured -eq 0) {
        Add-RollupRow -Rows $rows -Signal 'timing-budget' -Disposition 'WARN' -Summary 'Timing budget has no measured phases (guidance-only or missing data).' -Remediation 'Attach staging-smoke or run proof collection with measured timings.'
    }
    else {
        Add-RollupRow -Rows $rows -Signal 'timing-budget' -Disposition 'PASS' -Summary "$measured timing phase(s) measured in this proof run." -Remediation ''
    }
}

$smoke = Read-JsonFileIfPresent -Path (Join-Path $proofDir 'staging-smoke-summary.json')

if ($null -ne $smoke) {
    $smokeOk = $smoke.ok -eq $true

    if ($smokeOk) {
        Add-RollupRow -Rows $rows -Signal 'staging-smoke' -Disposition 'PASS' -Summary 'Staging smoke summary attached and reports ok.' -Remediation ''
    }
    else {
        Add-RollupRow -Rows $rows -Signal 'staging-smoke' -Disposition 'WARN' -Summary 'Staging smoke summary attached with failures or warnings.' -Remediation 'Review staging-smoke-summary.json before release evidence.'
    }
}

$holdCountTotal = @($rows | Where-Object { [string]$_.disposition -eq 'HOLD' }).Count
$warnCountTotal = @($rows | Where-Object { [string]$_.disposition -eq 'WARN' }).Count
$rollupDisposition = if ($holdCountTotal -gt 0) { 'HOLD' } elseif ($warnCountTotal -gt 0) { 'WARN' } else { 'PASS' }

$payload = [ordered]@{
    generatedUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    disposition  = $rollupDisposition
    holdCount    = $holdCountTotal
    warnCount    = $warnCountTotal
    rows         = $rows
}

$jsonOut = Join-Path $proofDir 'environment-reliability-rollup.json'
$mdOut = Join-Path $proofDir 'environment-reliability-rollup.md'
$payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonOut -Encoding UTF8

$mdLines = [System.Collections.Generic.List[string]]::new()
$mdLines.Add('# Environment reliability rollup')
$mdLines.Add('')
$mdLines.Add('Buyer-safe rollup of data consistency, telemetry export, AI readiness, LLM budget, timing budget, and optional staging smoke. **Not an SLA** — engineering evidence only.')
$mdLines.Add('')
$mdLines.Add("| Rollup | **$rollupDisposition** |")
$mdLines.Add("| HOLD rows | $holdCountTotal |")
$mdLines.Add("| WARN rows | $warnCountTotal |")
$mdLines.Add('')
$mdLines.Add('| Signal | Disposition | Summary | Remediation |')
$mdLines.Add('| --- | --- | --- | --- |')

foreach ($row in $rows) {
    $summary = ([string]$row.summary).Replace('|', '\|')
    $remediation = ([string]$row.remediation).Replace('|', '\|')
    $mdLines.Add("| $($row.signal) | $($row.disposition) | $summary | $remediation |")
}

$mdLines.Add('')
$mdLines | Set-Content -LiteralPath $mdOut -Encoding UTF8

Write-Output "environment reliability rollup: $rollupDisposition"
