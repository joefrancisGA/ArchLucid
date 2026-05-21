#Requires -Version 7.0
<#
.SYNOPSIS
  Staging-only Azure SQL failover drill helper aligned with docs/runbooks/DATABASE_FAILOVER.md.

.DESCRIPTION
  Measures wall-clock downtime between initiating manual geo-failover (operator step) and
  ArchLucid API readiness recovery. Appends a structured entry to docs/quality/game-day-log/FAILOVER_RESULTS.md.

  This script does NOT invoke Azure failover by itself — run `az sql failover-group set-primary`
  (or Portal equivalent) when prompted, then press Enter to continue timing.

.PARAMETER ApiBaseUrl
  Staging ArchLucid API root (e.g. https://staging-api.example.com).

.PARAMETER ResultsPath
  Markdown log to append (default: repo docs/quality/game-day-log/FAILOVER_RESULTS.md).

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

    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path

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

Write-Host "ArchLucid staging SQL failover drill"
Write-Host "Runbook: docs/runbooks/DATABASE_FAILOVER.md"
Write-Host ""

$pre = Test-ApiReady -BaseUrl $ApiBaseUrl
Write-Host "Pre-drill GET /health/ready: status=$($pre.StatusCode) ok=$($pre.Ok)"

if ($WhatIf) {
    Write-Host "[WhatIf] Would prompt for manual failover, poll until ready, append to $ResultsPath"
    exit 0
}

Write-Host ""
Write-Host "1. Confirm staging failover group listener and Key Vault connection strings."
Write-Host "2. Initiate manual geo-failover in Azure Portal or via az cli."
Write-Host "3. Press Enter when failover has been triggered to start downtime measurement."
[void][System.Console]::ReadLine()

$failoverStartUtc = [DateTime]::UtcNow
Write-Host "Failover triggered at $($failoverStartUtc.ToString('o')) — polling /health/ready ..."

$deadline = (Get-Date).AddMinutes(30)
$recoveredUtc = $null

while ((Get-Date) -lt $deadline) {
    $probe = Test-ApiReady -BaseUrl $ApiBaseUrl

    if ($probe.Ok) {
        $recoveredUtc = [DateTime]::UtcNow
        break
    }

    Start-Sleep -Seconds 10
}

if ($null -eq $recoveredUtc) {
    Write-Error "API did not recover within 30 minutes. Record partial results manually in FAILOVER_RESULTS.md."
}

$downtime = $recoveredUtc - $failoverStartUtc
$entry = @"

## Drill $(Get-Date -Format 'yyyy-MM-dd') — staging manual geo-failover

| Field | Value |
|-------|-------|
| **Environment** | Staging only |
| **API base** | ``$ApiBaseUrl`` |
| **Failover initiated (UTC)** | $($failoverStartUtc.ToString('o')) |
| **Health ready restored (UTC)** | $($recoveredUtc.ToString('o')) |
| **Observed downtime** | $([math]::Round($downtime.TotalMinutes, 1)) minutes |
| **Pre-drill ready status** | $($pre.StatusCode) |
| **Runbook** | [DATABASE_FAILOVER.md](../../runbooks/DATABASE_FAILOVER.md) |

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

Append-only entries from ``scripts/ops/run-failover-drill.ps1``.

"@ | Set-Content -Path $ResultsPath -Encoding utf8
    }

    Add-Content -Path $ResultsPath -Value $entry -Encoding utf8
    Write-Host "Appended results to $ResultsPath"
}

Write-Host "Observed downtime: $([math]::Round($downtime.TotalMinutes, 1)) minutes"
