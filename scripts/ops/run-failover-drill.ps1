#Requires -Version 7.0
<#
.SYNOPSIS
  Staging-only Azure SQL failover drill helper aligned with docs/runbooks/DATABASE_FAILOVER.md and TB-905.

.DESCRIPTION
  Measures wall-clock downtime between initiating manual geo-failover (operator step) and
  ArchLucid API readiness recovery. Appends a structured entry to docs/quality/game-day-log/FAILOVER_RESULTS.md.

  This script does NOT invoke Azure failover by itself — run `az sql failover-group set-primary`
  (or Portal equivalent) when prompted, then press Enter to continue timing.

.PARAMETER ApiBaseUrl
  Staging ArchLucid API root (e.g. https://staging-api.example.com).

.PARAMETER ResultsPath
  Markdown log to append (default: repo docs/quality/game-day-log/FAILOVER_RESULTS.md).

.PARAMETER ReplicationLagMinutes
  Replication lag noted from Azure Portal immediately before failover (RPO estimate).

.PARAMETER WhatIf
  Print the drill checklist without writing results or polling health.

.EXAMPLE
  ./scripts/ops/run-failover-drill.ps1 -ApiBaseUrl https://staging.example.com -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string] $ApiBaseUrl,

    [string] $ResultsPath = "",

    [double] $ReplicationLagMinutes = -1,

    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$targetRtoMinutes = 60
$targetRpoMinutes = 5

if ([string]::IsNullOrWhiteSpace($ResultsPath)) {
    $ResultsPath = Join-Path $repoRoot "docs" "quality" "game-day-log" "FAILOVER_RESULTS.md"
}

function Test-ApiReady {
    param([string] $BaseUrl)

    $healthUrl = "$($BaseUrl.TrimEnd('/'))/health/ready"

    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 15 -SkipHttpErrorCheck
        return @{
            Ok = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
            StatusCode = [int]$response.StatusCode
            Url = $healthUrl
        }
    }
    catch {
        return @{
            Ok = $false
            StatusCode = 0
            Url = $healthUrl
            Error = $_.Exception.Message
        }
    }
}

function Update-FailoverSummaryTable {
    param(
        [string] $Path,
        [string] $Date,
        [double] $RtoMinutes,
        [string] $RpoText,
        [string] $PassFail,
        [string] $Notes
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $content = Get-Content -LiteralPath $Path -Raw -Encoding utf8
    $pendingRow = '| _Pending first staging execution_ | Staging | _TBD_ | Run ``./scripts/ops/run-failover-drill.ps1`` after scheduling the drill |'

    $newRow = "| $Date | Staging | $([math]::Round($RtoMinutes, 1)) min | $RpoText | < $targetRtoMinutes min | < $targetRpoMinutes min | $PassFail | $Notes |"

    if ($content.Contains($pendingRow)) {
        $content = $content.Replace($pendingRow, $newRow)
        Set-Content -LiteralPath $Path -Value $content -Encoding utf8 -NoNewline
    }
}

Write-Host "ArchLucid staging SQL failover drill (TB-905)"
Write-Host "Runbook: docs/runbooks/GEO_FAILOVER_DRILL.md"
Write-Host ""

$pre = Test-ApiReady -BaseUrl $ApiBaseUrl
Write-Host "Pre-drill GET /health/ready: status=$($pre.StatusCode) ok=$($pre.Ok)"

if ($WhatIf) {
    Write-Host "[WhatIf] Would prompt for manual failover, poll until ready, append to $ResultsPath"
    exit 0
}

Write-Host ""
Write-Host "1. Confirm staging failover group listener and Key Vault connection strings."
Write-Host "2. Note replication lag in Azure Portal (RPO estimate)."
Write-Host "3. Initiate manual geo-failover in Azure Portal or via az cli."
Write-Host "4. Press Enter when failover has been triggered to start downtime measurement."
[void][System.Console]::ReadLine()

$failoverStartUtc = [DateTime]::UtcNow
$firstUnhealthyUtc = $null
Write-Host "Failover triggered at $($failoverStartUtc.ToString('o')) — polling /health/ready ..."

$deadline = (Get-Date).AddMinutes(30)
$recoveredUtc = $null
$sawHealthyAfterStart = $false

while ((Get-Date) -lt $deadline) {
    $probe = Test-ApiReady -BaseUrl $ApiBaseUrl

    if ($probe.Ok) {
        if ($null -eq $recoveredUtc -and $null -ne $firstUnhealthyUtc) {
            $recoveredUtc = [DateTime]::UtcNow
            break
        }

        $sawHealthyAfterStart = $true
    }
    elseif ($pre.Ok -and $null -eq $firstUnhealthyUtc) {
        $firstUnhealthyUtc = [DateTime]::UtcNow
    }

    if ($null -ne $recoveredUtc) {
        break
    }

    Start-Sleep -Seconds 5
}

if ($null -eq $recoveredUtc) {
    if ($sawHealthyAfterStart -and $null -eq $firstUnhealthyUtc) {
        $recoveredUtc = [DateTime]::UtcNow
        $firstUnhealthyUtc = $failoverStartUtc
    }
    else {
        Write-Error "API did not recover within 30 minutes. Record partial results manually in FAILOVER_RESULTS.md."
    }
}

if ($null -eq $firstUnhealthyUtc) {
    $firstUnhealthyUtc = $failoverStartUtc
}

$rtoSpan = $recoveredUtc - $firstUnhealthyUtc
$rtoMinutes = $rtoSpan.TotalMinutes

if ($ReplicationLagMinutes -lt 0) {
    $rpoPrompt = Read-Host "Replication lag before failover (minutes, Enter to skip)"
    $parsedLag = 0.0

    if (-not [string]::IsNullOrWhiteSpace($rpoPrompt) -and [double]::TryParse($rpoPrompt, [ref]$parsedLag)) {
        $ReplicationLagMinutes = $parsedLag
    }
}

$rpoText = if ($ReplicationLagMinutes -ge 0) { "$([math]::Round($ReplicationLagMinutes, 1)) min (portal lag)" } else { "not recorded" }
$rtoPass = $rtoMinutes -lt $targetRtoMinutes
$rpoPass = ($ReplicationLagMinutes -ge 0) -and ($ReplicationLagMinutes -lt $targetRpoMinutes)
$overallPass = if ($rtoPass -and ($ReplicationLagMinutes -lt 0 -or $rpoPass)) { "PASS" } elseif ($rtoPass) { "PASS (RTO only)" } else { "FAIL" }

$drillDate = Get-Date -Format 'yyyy-MM-dd'
$entry = @"

## Drill $drillDate — staging manual geo-failover (TB-905)

| Field | Value |
|-------|-------|
| **Environment** | Staging only |
| **API base** | ``$ApiBaseUrl`` |
| **Failover initiated (UTC)** | $($failoverStartUtc.ToString('o')) |
| **First unhealthy (UTC)** | $($firstUnhealthyUtc.ToString('o')) |
| **Health ready restored (UTC)** | $($recoveredUtc.ToString('o')) |
| **RTO (recovery − first unhealthy)** | $([math]::Round($rtoMinutes, 1)) minutes (target < $targetRtoMinutes) |
| **RPO estimate (replication lag)** | $rpoText (target < $targetRpoMinutes min) |
| **Overall** | $overallPass |
| **Pre-drill ready status** | $($pre.StatusCode) |
| **Runbook** | [TB-905_STAGING_RELIABILITY_DRILL.md](../../runbooks/TB-905_STAGING_RELIABILITY_DRILL.md) |

### Post-failover smoke (operator checklist)

- [ ] Create architecture request → execute → commit
- [ ] Open governance comparison endpoint
- [ ] Verify SQL dependency duration in App Insights / OpenTelemetry

"@

if ($PSCmdlet.ShouldProcess($ResultsPath, "Append failover drill results")) {
    $dir = Split-Path -Parent $ResultsPath

    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if (-not (Test-Path $ResultsPath)) {
        @"
> **Scope:** Staging Azure SQL manual geo-failover drill results. Production failover remains owner-gated.

# Failover drill results log

Append-only entries from ``scripts/ops/run-failover-drill.ps1`` (TB-905).

| Date | Environment | RTO (observed) | RPO (est.) | Target RTO | Target RPO | Pass | Notes |
|------|-------------|----------------|------------|------------|------------|------|-------|
| _Pending first staging execution_ | Staging | _TBD_ | _TBD_ | < 60 min | < 5 min | — | Run ``./scripts/ops/run-failover-drill.ps1`` after scheduling the drill |

"@ | Set-Content -Path $ResultsPath -Encoding utf8
    }

    Add-Content -Path $ResultsPath -Value $entry -Encoding utf8
    Update-FailoverSummaryTable -Path $ResultsPath -Date $drillDate -RtoMinutes $rtoMinutes -RpoText $rpoText -PassFail $overallPass -Notes "TB-905 geo-failover"
    Write-Host "Appended results to $ResultsPath"
}

Write-Host "Observed RTO: $([math]::Round($rtoMinutes, 1)) minutes ($overallPass)"
