#requires -Version 5.1
<#
.SYNOPSIS
  Emit a compact evidence-to-manifest-to-audit trace-chain summary from committed-run evidence bundle.
#>
param(
    [Parameter(Mandatory = $true)][string] $ProofDirectory,
    [Parameter(Mandatory = $true)][string] $EvidenceRoot,
    [string] $RunId = ''
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

function Get-LatestEvidenceBundleDirectory {
    param([string] $Root)

    if (-not (Test-Path -LiteralPath $Root)) {
        return $null
    }

    $dirs = Get-ChildItem -LiteralPath $Root -Directory -ErrorAction SilentlyContinue |
        Sort-Object -Property LastWriteTimeUtc -Descending

    if ($dirs.Count -eq 0) {
        return $null
    }

    return $dirs[0].FullName
}

$bundleDir = Get-LatestEvidenceBundleDirectory -Root $EvidenceRoot
$chain = [ordered]@{
    generatedUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    runId        = if ([string]::IsNullOrWhiteSpace($RunId)) { $null } else { $RunId.Trim() }
    bundlePath   = if ($null -eq $bundleDir) { $null } else { $bundleDir.Replace($ProofDirectory, '').TrimStart('\', '/') }
    steps        = @()
    disposition  = 'WARN'
    summary      = 'Committed-run evidence bundle not found — trace chain summary not collected.'
}

if ($null -ne $bundleDir) {
    $observability = Read-JsonFileIfPresent -Path (Join-Path $bundleDir 'pilot-observability-summary.json')
    $manifest = Read-JsonFileIfPresent -Path (Join-Path $bundleDir 'artifact-manifest.json')
    $steps = [System.Collections.Generic.List[object]]::new()

    $evidenceLabel = 'Evidence ingest'

    if ($null -ne $observability) {
        $evidenceLabel = "Evidence ingest (LLM mode: $([string]$observability.llmExecutionMode))"
    }

    $steps.Add([ordered]@{
        order   = 1
        label   = $evidenceLabel
        status  = 'present'
        pointer = 'first-pilot-evidence/*/pilot-observability-summary.json'
    })

    $findingCount = $null

    if ($null -ne $observability -and $null -ne $observability.findingCount) {
        $findingCount = [int]$observability.findingCount
    }

    $steps.Add([ordered]@{
        order   = 2
        label   = 'Findings and analysis'
        status  = if ($null -ne $findingCount -and $findingCount -gt 0) { 'present' } else { 'attention' }
        pointer = 'first-pilot-evidence/*/ (findings in run deltas / first-value report)'
        detail  = if ($null -ne $findingCount) { "$findingCount finding(s) in observability summary" } else { 'Finding count not in observability summary' }
    })

    $manifestPresent = $null -ne $manifest

    $steps.Add([ordered]@{
        order   = 3
        label   = 'Golden manifest'
        status  = if ($manifestPresent) { 'present' } else { 'missing' }
        pointer = 'first-pilot-evidence/*/artifact-manifest.json'
    })

    $artifactCount = 0

    if ($manifestPresent -and $null -ne $manifest.artifacts) {
        $artifactCount = @($manifest.artifacts).Count
    }

    $steps.Add([ordered]@{
        order   = 4
        label   = 'Sponsor artifacts'
        status  = if ($artifactCount -gt 0) { 'present' } else { 'attention' }
        pointer = 'first-pilot-evidence/*/artifact-manifest.json'
        detail  = "$artifactCount artifact descriptor(s)"
    })

    $auditRows = $null

    if ($null -ne $observability -and $null -ne $observability.auditRowCount) {
        $auditRows = [int]$observability.auditRowCount
    }

    $steps.Add([ordered]@{
        order   = 5
        label   = 'Durable audit trail'
        status  = if ($null -ne $auditRows -and $auditRows -gt 0) { 'present' } elseif ($null -ne $auditRows) { 'attention' } else { 'unknown' }
        pointer = 'Audit export / pilot-observability-summary.json auditRowCount'
        detail  = if ($null -ne $auditRows) { "$auditRows audit row(s) referenced" } else { 'Audit row count not summarized' }
    })

    $missing = @($steps | Where-Object { [string]$_.status -eq 'missing' }).Count
    $attention = @($steps | Where-Object { [string]$_.status -in @('attention', 'unknown') }).Count

    $chain.disposition = if ($missing -gt 0) { 'HOLD' } elseif ($attention -gt 0) { 'WARN' } else { 'PASS' }
    $chain.summary = if ($missing -gt 0) {
        'Trace chain has missing manifest or evidence steps — resolve before sponsor send.'
    }
    elseif ($attention -gt 0) {
        'Trace chain is present with gaps — review first-value report and observability summary.'
    }
    else {
        'Trace chain from evidence through manifest and audit is present for this committed review.'
    }

    $chain.steps = $steps.ToArray()
}

$jsonOut = Join-Path $ProofDirectory 'committed-review-trace-chain-summary.json'
$mdOut = Join-Path $ProofDirectory 'committed-review-trace-chain-summary.md'
$chain | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonOut -Encoding UTF8

$md = [System.Collections.Generic.List[string]]::new()
$md.Add('# Committed review trace chain (generated)')
$md.Add('')
$md.Add("> **Disposition:** $($chain.disposition) — $($chain.summary)")
$md.Add('')
$md.Add('| Step | Status | Detail | Pointer |')
$md.Add('| --- | --- | --- | --- |')

foreach ($step in $chain.steps) {
    $detail = if ($null -ne $step.detail) { [string]$step.detail } else { '' }
    $md.Add("| $($step.label) | $($step.status) | $detail | ``$($step.pointer)`` |")
}

$md.Add('')
$md.Add('UI parity: review detail **Trust & evidence** card shows the same evidence-to-manifest-to-audit chain when run data is loaded.')
$md.Add('')
$md | Set-Content -LiteralPath $mdOut -Encoding UTF8

Write-Output "committed review trace chain: $($chain.disposition)"
