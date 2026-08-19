<#
.SYNOPSIS
  TB-2146 helper: capture Phase B (/api/auth/me) median and scaffold a cold-start baseline row.
#>
[CmdletBinding()]
param(
    [ValidateSet('dev', 'staging', 'production')]
    [string] $Environment = 'staging',

    [Parameter(Mandatory = $true)]
    [string] $ApiBaseUrl,

    [Parameter(Mandatory = $true)]
    [string] $ApiKey,

    [string] $CommitSha = 'pending',

    [string] $CdRunUrl = '',

    [int] $PhaseBSampleCount = 3,

    [string] $OutputDirectory = '',

    [switch] $SkipReadyProbe
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Median {
    param([double[]] $Values)

    $sorted = @($Values | Sort-Object)
  if ($sorted.Count -eq 0) {
        throw 'Cannot compute median of empty sample.'
    }

    $mid = [int][math]::Floor(($sorted.Count - 1) / 2)
    if ($sorted.Count % 2 -eq 1) {
        return $sorted[$mid]
    }

    return ($sorted[$mid] + $sorted[$mid + 1]) / 2.0
}

function Get-PaidLeverReopenVerdict {
    param(
        [Nullable[double]] $PhaseASeconds,
        [Nullable[double]] $PhaseBMedianSeconds
    )

    $lines = New-Object System.Collections.Generic.List[string]

    if ($null -ne $PhaseASeconds -and $PhaseASeconds -gt 120) {
        $lines.Add('Phase A > 120 s — investigate min_replicas, canary bake, DbUp/pre-migrate (see COLD_START_MEASUREMENT decision table).')
    }

    if ($null -ne $PhaseBMedianSeconds -and $PhaseBMedianSeconds -ge 2.0) {
        $lines.Add('Phase B median >= 2.0 s — reopen R2R / CPU bump / min_replicas per TB-2124 matrix after owner sign-off.')
    }

    if ($null -ne $PhaseBMedianSeconds -and $PhaseBMedianSeconds -lt 1.0) {
        $lines.Add('Phase B median < 1.0 s — paid levers remain no-go on Phase B evidence.')
    }

    if ($lines.Count -eq 0) {
        return 'No automatic reopen triggers fired; update PERFORMANCE_COLD_START_AND_TRIMMING.md owner matrix after review.'
    }

    return ($lines -join ' ')
}

$base = $ApiBaseUrl.TrimEnd('/')
$readyUrl = "$base/health/ready"
$authMeUrl = "$base/api/auth/me"

Write-Host 'TB-2146 — cold-start baseline capture'
Write-Host ("Environment: {0}" -f $Environment)
Write-Host ("API: {0}" -f $base)
Write-Host 'Runbook: docs/runbooks/COLD_START_MEASUREMENT.md'
Write-Host ''

if (-not $SkipReadyProbe) {
    Write-Host ("Probing {0} ..." -f $readyUrl)
    $readyResponse = Invoke-WebRequest -Uri $readyUrl -Method Get -TimeoutSec 30 -UseBasicParsing
    if ($readyResponse.StatusCode -ne 200) {
        throw ("Ready probe returned HTTP {0}" -f $readyResponse.StatusCode)
    }

    Write-Host '  /health/ready is HTTP 200 (record Phase A from CD revision timestamps separately).'
}

$phaseBSamples = New-Object System.Collections.Generic.List[double]
for ($i = 1; $i -le $PhaseBSampleCount; $i++) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $authMeUrl -Method Get -Headers @{ 'X-Api-Key' = $ApiKey } -TimeoutSec 60 -UseBasicParsing
    $stopwatch.Stop()

    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw ("GET /api/auth/me sample {0} returned HTTP {1}" -f $i, $response.StatusCode)
    }

    $seconds = $stopwatch.Elapsed.TotalSeconds
    $phaseBSamples.Add($seconds) | Out-Null
    Write-Host ("  Phase B sample {0}/{1}: {2:N3} s" -f $i, $PhaseBSampleCount, $seconds)
}

$phaseBMedian = Get-Median -Values $phaseBSamples.ToArray()
Write-Host ''
Write-Host ("Phase B median (/api/auth/me): {0:N3} s" -f $phaseBMedian)
Write-Host ("Reopen gate: {0}" -f (Get-PaidLeverReopenVerdict -PhaseASeconds $null -PhaseBMedianSeconds $phaseBMedian))

if ($OutputDirectory.Trim().Length -eq 0) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $OutputDirectory = Join-Path $repoRoot 'docs\operations\cold-start-baselines'
}

$dateStamp = Get-Date -Format 'yyyy-MM-dd'
$shortSha = if ($CommitSha.Length -ge 7) { $CommitSha.Substring(0, 7) } else { $CommitSha }
$fileName = '{0}-{1}-{2}-tb2146.md' -f $Environment, $dateStamp, $shortSha
$outputPath = Join-Path $OutputDirectory $fileName

$cdLine = if ($CdRunUrl.Trim().Length -gt 0) { $CdRunUrl.Trim() } else { '*pending CD run URL*' }

$content = @"
# Cold-start baseline — $Environment (TB-2146)

**Captured:** $dateStamp  
**Environment:** $Environment  
**CD run:** $cdLine  
**Commit:** ``$CommitSha``  
**Method:** [`COLD_START_MEASUREMENT.md`](../../runbooks/COLD_START_MEASUREMENT.md) procedure 2 + `scripts/ops/capture-cold-start-baseline.ps1`

## Measurements

| Phase | Value | Notes |
|-------|-------|-------|
| **A — Revision → ready** | *Record from CD / ACA revision timestamps* | Exclude intentional canary bake when measuring platform time (**TB-755**) |
| **B — `/api/auth/me` after ready** | **$([math]::Round($phaseBMedian, 3)) s** median ($PhaseBSampleCount samples) | Captured by TB-2146 script |
| **C — deployment-evidence** | *Record attempt count from Post-deploy validation* | |

## Paid-lever reopen gate (TB-2146 / TB-2124)

| Trigger | Threshold | This capture |
|---------|-----------|--------------|
| Phase **A** platform time | > **120 s** | *Owner: fill from CD log* |
| Phase **B** `/api/auth/me` median | ≥ **2.0 s** | **$([math]::Round($phaseBMedian, 3)) s** |
| Phase **B** staging target | < **1.0 s** | $(if ($phaseBMedian -lt 1.0) { 'Within target' } else { 'Above target — review matrix' }) |

**Automated note:** $(Get-PaidLeverReopenVerdict -PhaseASeconds $null -PhaseBMedianSeconds $phaseBMedian)

## Owner follow-up

1. Fill Phase **A** and **C** from the staging CD run; append a row to [`README.md`](README.md).
2. Update [`PERFORMANCE_COLD_START_AND_TRIMMING.md`](../../library/PERFORMANCE_COLD_START_AND_TRIMMING.md) owner go/no-go if any reopen trigger fired.
"@

Set-Content -LiteralPath $outputPath -Value $content -Encoding utf8NoBOM
Write-Host ''
Write-Host ("Wrote scaffold baseline: {0}" -f $outputPath)
exit 0
