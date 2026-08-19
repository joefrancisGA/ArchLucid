#requires -Version 7
<#
.SYNOPSIS
  Preflight checks before Teams / Slack / Confluence smoke (API reachability only — no vendor secrets).

.DESCRIPTION
  Calls GET /health/live on ARCHLUCID_API_BASE_URL (trailing slash optional). Mirrors the ITSM
  live-validation pattern (scripts/integrations/validate-itsm-live.ps1) so all five V1 GA first-party
  connectors have a scripted preflight, not just Jira/ServiceNow.
  Pair with CONNECTOR_SMOKE_TEAMS.md / CONNECTOR_SMOKE_SLACK.md / CONNECTOR_SMOKE_CONFLUENCE.md for
  full vendor validation (real webhook post / real page publish).

.EXAMPLE
  $env:ARCHLUCID_API_BASE_URL = "https://localhost:5000"
  .\scripts\integrations\validate-collab-connectors-live.ps1
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
