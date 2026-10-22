#Requires -Version 7.0
<#
.SYNOPSIS
  Verify ArchLucid P0-related Prometheus series are present in Azure Monitor workspace (TB-957).

.DESCRIPTION
  Queries the terraform-monitoring output azure_monitor_prometheus_query_endpoint for a small
  set of series used by prometheus_p0_rules.tf. Exit 0 when at least one series returns data;
  exit 1 when all queries are empty or the endpoint/token cannot be resolved.

.PARAMETER MonitoringRoot
  Path to infra/terraform-monitoring (default: repo-relative).

.PARAMETER QueryEndpoint
  Override terraform output (absolute AMW Prometheus query base URL).

.PARAMETER AllowEmpty
  Exit 0 even when all series are empty (print warnings only) — for dry documentation runs.
#>
[CmdletBinding()]
param(
    [string] $MonitoringRoot = "",

    [string] $QueryEndpoint = "",

    [switch] $AllowEmpty
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path

if ([string]::IsNullOrWhiteSpace($MonitoringRoot)) {
    $MonitoringRoot = Join-Path $repoRoot "infra/terraform-monitoring"
}

Write-Host "TB-957 AMW scrape verify"
Write-Host "Checklist: docs/operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md"
Write-Host ""

if ([string]::IsNullOrWhiteSpace($QueryEndpoint)) {
    if (-not (Test-Path -LiteralPath $MonitoringRoot)) {
        Write-Error "Monitoring root not found: $MonitoringRoot"
    }

    Push-Location -LiteralPath $MonitoringRoot

    try {
        $QueryEndpoint = (terraform output -raw azure_monitor_prometheus_query_endpoint 2>$null)
    }
    finally {
        Pop-Location
    }
}

if ([string]::IsNullOrWhiteSpace($QueryEndpoint)) {
    Write-Error "Could not resolve azure_monitor_prometheus_query_endpoint. Pass -QueryEndpoint or run terraform apply in infra/terraform-monitoring."
}

$token = az account get-access-token --resource https://prometheus.monitor.azure.com --query accessToken -o tsv

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Error "az account get-access-token failed. Sign in with Azure CLI and retry."
}

$headers = @{ Authorization = "Bearer $token" }
$queries = @(
    "archlucid_circuit_breaker_state",
    "archlucid_health_check_status",
    "archlucid_authority_pipeline_work_dead_letter",
    "archlucid_runs_stale_in_flight_count",
    "up{job=`"archlucid-api`"}"
)

$anyHit = $false

foreach ($query in $queries) {
    $encoded = [uri]::EscapeDataString($query)
    $uri = "$($QueryEndpoint.TrimEnd('/'))/api/v1/query?query=$encoded"
    Write-Host ("Query: {0}" -f $query)

    try {
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
        $resultCount = 0

        if ($null -ne $response.data -and $null -ne $response.data.result) {
            $resultCount = @($response.data.result).Count
        }

        Write-Host ("  result_count={0}" -f $resultCount)

        if ($resultCount -gt 0) {
            $anyHit = $true
        }
    }
    catch {
        Write-Warning ("  query failed: {0}" -f $_.Exception.Message)
    }
}

Write-Host ""

if ($anyHit) {
    Write-Host "PASS: At least one P0-related series is present in AMW."
    Write-Host "Next: Azure Portal → Alerts → Test a critical P0 rule (GTM M-120)."
    exit 0
}

$message = "FAIL: No P0-related series returned data. Confirm OTel→AMW export and APPLICATIONINSIGHTS_CONNECTION_STRING wiring."

if ($AllowEmpty) {
    Write-Warning $message
    exit 0
}

Write-Error $message
