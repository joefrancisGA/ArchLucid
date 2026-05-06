#requires -Version 5.1
<#
.SYNOPSIS
    Lightweight ArchLucid API readiness probes (liveness, OpenAPI contract, version JSON).

.DESCRIPTION
    Mirrors a subset of checks bundled into archlucid support-bundle: GET /health/live, GET /openapi/v1.json,
    GET /version. Uses ARCHLUCID_API_URL when -BaseUrl omitted; forwards ARCHLUCID_API_KEY when set.

.PARAMETER BaseUrl
    HTTP(S) API root without trailing operation path (example: http://localhost:5128).

.EXAMPLE
    ./env-readiness.ps1 -BaseUrl http://localhost:5128
#>
param(
    [string] $BaseUrl = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:5128'
}

$root = $BaseUrl.TrimEnd('/')

function Invoke-ArchLucidProbe {
    param(
        [Parameter(Mandatory = $true)][string] $Label,
        [Parameter(Mandatory = $true)][string] $RelativePath
    )

    $uri = "$root$RelativePath"
    Write-Host "[$Label] GET $uri"

    $headers = @{}

    if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_API_KEY)) {
        $headers['X-Api-Key'] = $env:ARCHLUCID_API_KEY
    }

    try {
        Invoke-WebRequest -Uri $uri -UseBasicParsing -Method GET -Headers $headers -TimeoutSec 45 | Out-Null
    }
    catch {
        throw "Probe '$Label' failed: $($_.Exception.Message)"
    }
}

Invoke-ArchLucidProbe -Label 'health/live' -RelativePath '/health/live'
Invoke-ArchLucidProbe -Label 'openapi/v1.json' -RelativePath '/openapi/v1.json'
Invoke-ArchLucidProbe -Label 'version' -RelativePath '/version'

Write-Host 'env-readiness.ps1: all probes succeeded.'
exit 0
