# Dot-source from scripts/: . (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')
# Builds optional Authorization / X-Api-Key headers for ArchLucid HTTP APIs.
# Precedence: explicit parameters win; otherwise ARCHLUCID_BEARER_TOKEN / ARCHLUCID_API_KEY env vars.
function Get-ArchLucidHttpAuthHeadersHashtable {
    param(
        [string] $BearerToken = '',
        [string] $ApiKey = ''
    )

    [hashtable] $headers = @{}

    [string] $resolvedBearer = ''

    if (-not [string]::IsNullOrWhiteSpace($BearerToken)) {
        $resolvedBearer = $BearerToken.Trim()
    }
    elseif ($null -ne $env:ARCHLUCID_BEARER_TOKEN -and -not [string]::IsNullOrWhiteSpace([string]$env:ARCHLUCID_BEARER_TOKEN)) {
        $resolvedBearer = $env:ARCHLUCID_BEARER_TOKEN.Trim()
    }

    [string] $resolvedApiKey = ''

    if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
        $resolvedApiKey = $ApiKey.Trim()
    }
    elseif ($null -ne $env:ARCHLUCID_API_KEY -and -not [string]::IsNullOrWhiteSpace([string]$env:ARCHLUCID_API_KEY)) {
        $resolvedApiKey = $env:ARCHLUCID_API_KEY.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($resolvedBearer)) {
        $headers['Authorization'] = 'Bearer ' + $resolvedBearer
    }

    if (-not [string]::IsNullOrWhiteSpace($resolvedApiKey)) {
        $headers['X-Api-Key'] = $resolvedApiKey
    }

    return $headers
}
