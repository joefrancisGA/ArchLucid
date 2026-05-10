#requires -Version 7
<#
.SYNOPSIS
  Preflight checks before Jira / ServiceNow smoke (API reachability only — no vendor secrets).

.DESCRIPTION
  Calls GET /health/live on ARCHLUCID_API_BASE_URL (trailing slash optional).
  Pair with CONNECTOR_SMOKE_JIRA.md / CONNECTOR_SMOKE_SERVICENOW.md for full ITSM validation.

.EXAMPLE
  $env:ARCHLUCID_API_BASE_URL = "https://localhost:5000"
  .\scripts\integrations\validate-itsm-live.ps1
#>
param()

$ErrorActionPreference = "Stop"

$base = [string]$env:ARCHLUCID_API_BASE_URL

if ([string]::IsNullOrWhiteSpace($base)) {
    Write-Error "ARCHLUCID_API_BASE_URL is required (e.g. https://api.example.com)."
}

$trimmed = $base.TrimEnd('/')
$uri = "$trimmed/health/live"

Write-Host "Checking $uri"

try {
    $response = Invoke-WebRequest -Uri $uri -Method GET -UseBasicParsing -TimeoutSec 30
    Write-Host "OK $($response.StatusCode)"
    exit 0
}
catch {
    Write-Error "Health probe failed: $_"
    exit 1
}
