#requires -Version 5.1
<#
.SYNOPSIS
  Emit a buyer-safe admin operational posture rollup (JSON + Markdown) for first-pilot proof.
#>
param(
    [Parameter(Mandatory = $true)][string] $ProofDirectory,
    [string] $BaseUrl = '',
    [string] $BearerToken = '',
    [string] $ApiKey = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')

function Test-SecretLikeValue {
    param([string] $Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $false
    }

    $lower = $Value.ToLowerInvariant()

    if ($lower -match 'connectionstring|api[_-]?key|clientsecret|password|sharedaccesskey|accountkey') {
        return $true
    }

    if ($Value.Length -ge 24 -and $Value -notmatch '\s') {
        return $true
    }

    return $false
}

function Get-SafeScalar {
    param([object] $Value)

    if ($null -eq $Value) {
        return $null
    }

    $text = [string]$Value

    if (Test-SecretLikeValue -Value $text) {
        return '***'
    }

    return $text
}

function Read-JsonFileIfPresent {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -ErrorAction Stop
}

function Invoke-AdminGetJson {
    param(
        [Parameter(Mandatory = $true)][string] $RelativePath
    )

    if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
        return $null
    }

    $normalizedBase = $BaseUrl.Trim().TrimEnd('/')
    $headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey

    if ($headers.Count -eq 0) {
        return $null
    }

    $uri = "$normalizedBase$RelativePath"
    $req = @{
        Uri             = $uri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 60
        Headers         = $headers
    }

    try {
        $response = Invoke-WebRequest @req
        return [string]$response.Content
    }
    catch {
        return $null
    }
}

function Add-PostureRow {
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

$configLintPath = Join-Path $proofDir 'config-lint-production-like-hosted-pilot.json'
$configLint = Read-JsonFileIfPresent -Path $configLintPath

if ($null -eq $configLint) {
    Add-PostureRow -Rows $rows -Signal 'config-lint' -Disposition 'WARN' -Summary 'Production-like config lint artifact not collected.' -Remediation 'Rerun proof with -ProductionLikeHostedPilot or -SponsorHandoff.'
}
elseif ($configLint.ok -eq $true) {
    Add-PostureRow -Rows $rows -Signal 'config-lint' -Disposition 'PASS' -Summary 'Config lint ok for production-like hosted pilot profile.' -Remediation ''
}
else {
    Add-PostureRow -Rows $rows -Signal 'config-lint' -Disposition 'HOLD' -Summary 'Config lint reported blocking findings.' -Remediation 'Fix blocking rows in config-lint-production-like-hosted-pilot.md and rerun lint.'
}

$dataSummaryPath = Join-Path $proofDir 'data-consistency-readiness/data-consistency-summary.json'
$dataSummary = Read-JsonFileIfPresent -Path $dataSummaryPath

if ($null -eq $dataSummary) {
    Add-PostureRow -Rows $rows -Signal 'data-consistency' -Disposition 'WARN' -Summary 'Data-consistency summary not attached to proof folder.' -Remediation 'Run collect-data-consistency-readiness.ps1 without -SkipDataConsistency.'
}
else {
    $holdCount = @($dataSummary.probes | Where-Object { [string]$_.status -eq 'HOLD' }).Count
    $warnCount = @($dataSummary.probes | Where-Object { [string]$_.status -eq 'WARN' }).Count

    if ($holdCount -gt 0) {
        Add-PostureRow -Rows $rows -Signal 'data-consistency' -Disposition 'HOLD' -Summary "$holdCount data-consistency probe(s) on HOLD." -Remediation 'Open data-consistency-readiness/data-consistency-summary.json and follow probe remediation links.'
    }
    elseif ($warnCount -gt 0) {
        Add-PostureRow -Rows $rows -Signal 'data-consistency' -Disposition 'WARN' -Summary "$warnCount data-consistency probe(s) on WARN." -Remediation 'Review WARN probes before sponsor send.'
    }
    else {
        Add-PostureRow -Rows $rows -Signal 'data-consistency' -Disposition 'PASS' -Summary 'Data-consistency probes passed.' -Remediation ''
    }
}

$telemetryPath = Join-Path $proofDir 'observability-export-readiness.json'
$telemetry = Read-JsonFileIfPresent -Path $telemetryPath

if ($null -eq $telemetry) {
    Add-PostureRow -Rows $rows -Signal 'telemetry-export' -Disposition 'WARN' -Summary 'Telemetry export readiness artifact missing.' -Remediation 'Run scripts/ci/report_observability_export_readiness.py via proof pipeline.'
}
else {
    $verdict = [string]$telemetry.verdict

    if ($verdict -eq 'PASS') {
        Add-PostureRow -Rows $rows -Signal 'telemetry-export' -Disposition 'PASS' -Summary "Telemetry export readiness verdict is $verdict." -Remediation ''
    }
    elseif ($verdict -eq 'HOLD') {
        Add-PostureRow -Rows $rows -Signal 'telemetry-export' -Disposition 'HOLD' -Summary "Telemetry export readiness verdict is $verdict." -Remediation 'Configure Application Insights or OTLP export before hosted sponsor handoff.'
    }
    else {
        Add-PostureRow -Rows $rows -Signal 'telemetry-export' -Disposition 'WARN' -Summary "Telemetry export readiness verdict is $verdict." -Remediation 'Review observability-export-readiness.md.'
    }
}

$aiGatePath = Join-Path $proofDir 'ai-readiness-gate.json'
$aiGate = Read-JsonFileIfPresent -Path $aiGatePath

if ($null -eq $aiGate) {
    Add-PostureRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'WARN' -Summary 'Consolidated AI readiness gate not emitted.' -Remediation 'Rerun collect-first-pilot-proof.ps1 with committed-run evidence.'
}
else {
    $gateDisposition = [string]$aiGate.disposition

    if ($gateDisposition -eq 'PASS') {
        Add-PostureRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'PASS' -Summary 'AI readiness gate passed.' -Remediation ''
    }
    elseif ($gateDisposition -eq 'HOLD') {
        Add-PostureRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'HOLD' -Summary 'AI readiness gate is HOLD for sponsor-grade real-mode evidence.' -Remediation 'Resolve PilotStrict quality signals and attach retrieval grounding before sponsor send.'
    }
    else {
        Add-PostureRow -Rows $rows -Signal 'ai-readiness-gate' -Disposition 'WARN' -Summary "AI readiness gate disposition is $gateDisposition." -Remediation 'Review ai-readiness-gate.md before external circulation.'
    }
}

$llmBudgetPath = Join-Path $proofDir 'llm-budget-proof-status.json'
$llmBudget = Read-JsonFileIfPresent -Path $llmBudgetPath

if ($null -eq $llmBudget) {
    Add-PostureRow -Rows $rows -Signal 'llm-budget' -Disposition 'WARN' -Summary 'LLM budget proof status not attached.' -Remediation 'Collect committed-run evidence with -RunId to emit llm-budget-proof-status.json.'
}
else {
    $budgetStatus = Get-SafeScalar -Value $llmBudget.status
    Add-PostureRow -Rows $rows -Signal 'llm-budget' -Disposition 'PASS' -Summary "LLM budget posture recorded (status=$budgetStatus)." -Remediation ''
}

$routeTierPath = Join-Path $proofDir 'route-tier-policy-nav-parity.json'
$routeTier = Read-JsonFileIfPresent -Path $routeTierPath

if ($null -eq $routeTier) {
    Add-PostureRow -Rows $rows -Signal 'route-tier-nav' -Disposition 'WARN' -Summary 'Route/tier/policy/nav parity summary missing.' -Remediation 'Run python scripts/ci/assert_route_tier_policy_nav.py --sync.'
}
elseif ($routeTier.ok -eq $true) {
    Add-PostureRow -Rows $rows -Signal 'route-tier-nav' -Disposition 'PASS' -Summary 'Route/tier/policy/nav registry parity passed.' -Remediation ''
}
else {
    Add-PostureRow -Rows $rows -Signal 'route-tier-nav' -Disposition 'HOLD' -Summary 'Route/tier/policy/nav parity check failed.' -Remediation 'Run assert_route_tier_policy_nav.py --sync and repair registry drift.'
}

$authDiagnosticsRaw = Invoke-AdminGetJson -RelativePath '/v1/admin/auth-diagnostics'

if ($null -ne $authDiagnosticsRaw) {
    try {
        $authDiagnostics = $authDiagnosticsRaw | ConvertFrom-Json -ErrorAction Stop
        $mode = Get-SafeScalar -Value $authDiagnostics.mode
        Add-PostureRow -Rows $rows -Signal 'auth-diagnostics' -Disposition 'PASS' -Summary "Auth diagnostics reachable (mode=$mode)." -Remediation ''
    }
    catch {
        Add-PostureRow -Rows $rows -Signal 'auth-diagnostics' -Disposition 'WARN' -Summary 'Auth diagnostics response was not parseable JSON.' -Remediation 'Run archlucid auth diagnostics with an admin API key.'
    }
}
else {
    Add-PostureRow -Rows $rows -Signal 'auth-diagnostics' -Disposition 'WARN' -Summary 'Auth diagnostics not queried (missing BaseUrl or admin credentials).' -Remediation 'dotnet run --project ArchLucid.Cli -- auth diagnostics --json (admin API key).'
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

$jsonOut = Join-Path $proofDir 'admin-operational-posture.json'
$mdOut = Join-Path $proofDir 'admin-operational-posture.md'
$payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonOut -Encoding UTF8

$mdLines = [System.Collections.Generic.List[string]]::new()
$mdLines.Add('# Admin operational posture')
$mdLines.Add('')
$mdLines.Add('Buyer-safe rollup across config lint, data consistency, telemetry export, AI readiness, LLM budget, route/tier/nav parity, and auth diagnostics. **No secrets** are emitted.')
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
$mdLines.Add('Support escalation: `dotnet run --project ArchLucid.Cli -- support-bundle --zip` (review README.txt before external upload).')
$mdLines.Add('')
$mdLines | Set-Content -LiteralPath $mdOut -Encoding UTF8

Write-Output "admin operational posture: $rollupDisposition"
