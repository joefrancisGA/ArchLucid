#Requires -Version 7.0
<#
.SYNOPSIS
  TB-905 preflight checklist before staging geo-failover + load drills.

.PARAMETER ApiBaseUrl
  Staging ArchLucid API root (optional — when set, probes /health/ready).

.PARAMETER WhatIf
  Print checklist only; skip HTTP probe.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string] $ApiBaseUrl = "",

    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path

Write-Host "TB-905 staging reliability drill — preflight"
Write-Host "Owner runbook: docs/runbooks/TB-905_STAGING_RELIABILITY_DRILL.md"
Write-Host ""

$items = @(
    "Terraform: container-apps staging has secondary_region_stack_enabled = true (TB-903)",
    "Terraform: sql-failover staging has enable_sql_failover_group = true for drill window",
    "App config: ConnectionStrings:ArchLucid uses failover group read/write listener FQDN",
    "Azure Portal: note replication lag (minutes) before failover — RPO input",
    "Notify owner/on-call; record maintenance window",
    "Open App Insights / Grafana dashboards for cutover window"
)

$index = 1

foreach ($item in $items) {
    Write-Host ("  [{0}] {1}" -f $index, $item)
    $index++
}

if (-not [string]::IsNullOrWhiteSpace($ApiBaseUrl) -and -not $WhatIf) {
    $healthUrl = "$($ApiBaseUrl.TrimEnd('/'))/health/ready"
    Write-Host ""
    Write-Host "Probing $healthUrl ..."

    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 20 -SkipHttpErrorCheck
        $ok = $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
        Write-Host ("  /health/ready status={0} ok={1}" -f $response.StatusCode, $ok)

        if (-not $ok) {
            Write-Warning "Staging API is not ready — resolve before initiating failover."
            exit 1
        }
    }
    catch {
        Write-Error "Health probe failed: $($_.Exception.Message)"
    }
}

if ($WhatIf) {
    Write-Host ""
    Write-Host "[WhatIf] No HTTP probe. Next: run-failover-drill.ps1 then launch load drill per TB-905 runbook."
    exit 0
}

Write-Host ""
Write-Host "Preflight complete. Proceed to Phase B (run-failover-drill.ps1)."
