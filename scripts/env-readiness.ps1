#requires -Version 5.1
<#
.SYNOPSIS
    Lightweight ArchLucid API readiness probes (liveness, OpenAPI contract, version JSON).

.DESCRIPTION
    Mirrors a subset of checks bundled into archlucid support-bundle: GET /health/live, GET /openapi/v1.json,
    GET /version. Uses ARCHLUCID_API_URL when -BaseUrl omitted. Authentication: -BearerToken / -ApiKey, or env
    ARCHLUCID_BEARER_TOKEN / ARCHLUCID_API_KEY.

.PARAMETER BaseUrl
    HTTP(S) API root without trailing operation path (example: http://localhost:5128).

.EXAMPLE
    ./env-readiness.ps1 -BaseUrl http://localhost:5128
#>
param(
    [string] $BaseUrl = '',

    [string] $BearerToken = '',

    [string] $ApiKey = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')

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

    $headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey

    try {
        $req = @{
            Uri             = $uri
            UseBasicParsing = $true
            Method          = 'GET'
            TimeoutSec      = 45
        }

        if ($headers.Count -gt 0) {
            $req.Headers = $headers
        }

        Invoke-WebRequest @req | Out-Null
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
