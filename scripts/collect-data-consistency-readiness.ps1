#requires -Version 5.1
<#
.SYNOPSIS
  Collect data-consistency readiness signals for release or pilot handoff (read-only).

.PARAMETER BaseUrl
  API root (defaults to ARCHLUCID_API_URL or http://localhost:5128).
#>
param(
    [string] $BaseUrl = '',
    [string] $BearerToken = '',
    [string] $ApiKey = '',
    [string] $OutputDirectory = 'artifacts/data-consistency-readiness'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')
. (Join-Path $PSScriptRoot 'DataConsistencyProbeGuidance.ps1')

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:5128'
}

$normalizedBase = $BaseUrl.Trim().TrimEnd('/')
$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outDir = Join-Path (Get-Location) $OutputDirectory
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "data-consistency-readiness-$timestamp.md"
$summaryJsonPath = Join-Path $outDir 'data-consistency-summary.json'

function Invoke-ProbeText {
    param([string] $RelativePath)

    $uri = "$normalizedBase$RelativePath"
    $req = @{
        Uri             = $uri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 90
    }

    if ($headers.Count -gt 0) {
        $req.Headers = $headers
    }

    $response = Invoke-WebRequest @req
    return [string]$response.Content
}

$probeResults = [System.Collections.Generic.List[object]]::new()
$blockingFailures = 0
$warnings = 0

function Add-ProbeResult {
    param(
        [Parameter(Mandatory = $true)][string] $Probe,
        [Parameter(Mandatory = $true)][ValidateSet('PASS', 'WARN', 'HOLD')][string] $Status,
        [Parameter(Mandatory = $true)][string] $Notes
    )

    $guidance = Get-DataConsistencyProbeGuidance -Probe $Probe

    $probeResults.Add([ordered]@{
        probe                  = $Probe
        status                 = $Status
        notes                  = $Notes
        riskMeaning            = [string]$guidance.riskMeaning
        remediation            = [string]$guidance.remediation
        runbookLink            = [string]$guidance.runbookLink
        sponsorHandoffMustStop = [bool]$guidance.sponsorHandoffMustStop
    })

    if ($Status -eq 'HOLD') {
        $script:blockingFailures++
    }
    elseif ($Status -eq 'WARN') {
        $script:warnings++
    }
}

try {
    $ready = Invoke-ProbeText '/health/ready'
    Add-ProbeResult -Probe '/health/ready' -Status 'PASS' -Notes 'Response captured'
}
catch {
    Add-ProbeResult -Probe '/health/ready' -Status 'HOLD' -Notes $_.Exception.Message
}

try {
    $diag = Invoke-ProbeText '/health/diagnostics'
    Add-ProbeResult -Probe '/health/diagnostics' -Status 'PASS' -Notes 'Includes SQL + subsystem checks when authorized'
}
catch {
    Add-ProbeResult -Probe '/health/diagnostics' -Status 'WARN' -Notes "$($_.Exception.Message) — may require admin API key"
}

if ($headers.Count -gt 0) {
    try {
        $orphansJson = Invoke-ProbeText '/v1/admin/diagnostics/data-consistency/orphans'
        $orphans = $orphansJson | ConvertFrom-Json -ErrorAction Stop
        $totalOrphans = 0

        foreach ($property in $orphans.PSObject.Properties) {
            $value = $property.Value

            if ($null -ne $value -and $value -is [int]) {
                $totalOrphans += [int]$value
            }
            elseif ($null -ne $value -and $value -is [long]) {
                $totalOrphans += [int]$value
            }
        }

        if ($totalOrphans -gt 0) {
            Add-ProbeResult -Probe '/v1/admin/diagnostics/data-consistency/orphans' -Status 'HOLD' -Notes "Orphan count total=$totalOrphans"
        }
        else {
            Add-ProbeResult -Probe '/v1/admin/diagnostics/data-consistency/orphans' -Status 'PASS' -Notes 'No orphan rows reported'
        }
    }
    catch {
        Add-ProbeResult -Probe '/v1/admin/diagnostics/data-consistency/orphans' -Status 'WARN' -Notes "$($_.Exception.Message) — orphan probe unavailable"
    }
}
else {
    Add-ProbeResult -Probe '/v1/admin/diagnostics/data-consistency/orphans' -Status 'WARN' -Notes 'Skipped — supply BearerToken or ApiKey for orphan probe'
}

$dataConsistencyStatus = if ($blockingFailures -gt 0) {
    'HOLD'
}
elseif ($warnings -gt 0) {
    'WARN'
}
else {
    'PASS'
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# Data consistency readiness summary')
$lines.Add('')
$lines.Add("| Field | Value |")
$lines.Add("| --- | --- |")
$lines.Add("| Generated UTC | $timestamp |")
$lines.Add("| Base URL | $normalizedBase |")
$lines.Add("| Data consistency status | **$dataConsistencyStatus** |")
$lines.Add('')
$lines.Add('## Probes')
$lines.Add('')
$lines.Add('| Probe | Status | Risk | Remediation | Sponsor handoff stop | Notes |')
$lines.Add('| --- | --- | --- | --- | --- | --- |')

foreach ($probe in $probeResults) {
    $stopLabel = if ($probe.sponsorHandoffMustStop) { 'YES' } else { 'no' }
    $lines.Add("| $($probe.probe) | $($probe.status) | $($probe.riskMeaning) | $($probe.remediation) | $stopLabel | $($probe.notes) |")
}

$lines.Add('')
$lines.Add('## Interpretation')
$lines.Add('')
$lines.Add('- **Soft-archived runs** remain in `dbo.Runs` with `ArchivedUtc` set — not orphan rows.')
$lines.Add('- Orphan probes target missing parent run/manifest relationships — see `docs/library/DATA_CONSISTENCY_MATRIX.md`.')
$lines.Add('- Run dry-run remediation only via documented admin routes; this script does not mutate data.')
$lines.Add('')
$lines.Add('## Next steps when unhealthy')
$lines.Add('')
$lines.Add('1. Capture support bundle (`archlucid support-bundle`).')
$lines.Add('2. Review orphan counts in `/health/diagnostics` JSON.')
$lines.Add('3. Follow dry-run paths in [`DATA_CONSISTENCY_MATRIX.md`](../docs/library/DATA_CONSISTENCY_MATRIX.md).')

$lines | Set-Content -LiteralPath $outFile -Encoding UTF8

$summary = [ordered]@{
    formatVersion          = '1.0'
    generatedUtc           = $timestamp
    baseUrl                = $normalizedBase
    dataConsistencyStatus  = $dataConsistencyStatus
    blockingFailureCount   = $blockingFailures
    warningCount           = $warnings
    probes                 = $probeResults
    markdownReport         = (Split-Path -Leaf $outFile)
}
$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $summaryJsonPath -Encoding UTF8

Write-Host "Wrote $outFile"
Write-Host "Wrote $summaryJsonPath"
Write-Host "Data consistency status: $dataConsistencyStatus"

if ($dataConsistencyStatus -eq 'HOLD') {
    exit 1
}

if ($dataConsistencyStatus -eq 'WARN') {
    exit 2
}

exit 0
