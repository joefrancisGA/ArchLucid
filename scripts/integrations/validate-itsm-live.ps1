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
param(
    [string] $BearerToken = '',
    [string] $ApiKey = ''
)

$ErrorActionPreference = "Stop"

$scriptsDir = Split-Path -Parent $PSScriptRoot

. (Join-Path $scriptsDir 'ArchLucid.AuthHeaders.ps1')

$base = [string]$env:ARCHLUCID_API_BASE_URL

if ([string]::IsNullOrWhiteSpace($base)) {
    Write-Error "ARCHLUCID_API_BASE_URL is required (e.g. https://api.example.com)."
}

$trimmed = $base.TrimEnd('/')
$uri = "$trimmed/health/live"

Write-Host "Checking $uri"

$probeHeaders = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey

try {
    $req = @{
        Uri             = $uri
        Method          = 'GET'
        UseBasicParsing = $true
        TimeoutSec      = 30
    }

    if ($probeHeaders.Count -gt 0) {
        $req.Headers = $probeHeaders
    }

    $response = Invoke-WebRequest @req
    Write-Host "OK $($response.StatusCode)"
    exit 0
}
catch {
    Write-Error "Health probe failed: $_"
    exit 1
}
