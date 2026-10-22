#Requires -Version 5.1
<#
.SYNOPSIS
  Loads gitignored secrets/local-real-aoai.env into the current process (values never printed).

.DESCRIPTION
  Maps Foundry project URLs to classic https://{resource}.openai.azure.com/ for SDK parity with
  ArchLucid.Core.Configuration.AzureOpenAiEndpointNormalizer.
#>
[CmdletBinding()]
param(
    [string] $RepoRoot = (Split-Path -Parent $PSScriptRoot)
)

Set-StrictMode -Version Latest

if ($env:ARCHLUCID_SKIP_LOCAL_REAL_AOAI_ENV -eq '1') {
    return
}

function Normalize-AzureOpenAiEndpoint {
    param([string] $Endpoint)

    $trimmed = $Endpoint.Trim()

    if ($trimmed -match '^https://([^.]+)\.services\.ai\.azure\.com') {
        return ('https://{0}.openai.azure.com/' -f $Matches[1])
    }

    if ($trimmed -notmatch '/$') {
        return $trimmed + '/'
    }

    return $trimmed
}

$envPath = Join-Path $RepoRoot 'secrets\local-real-aoai.env'

if (!(Test-Path -LiteralPath $envPath)) {
    return
}

Get-Content -LiteralPath $envPath | ForEach-Object {
    $line = $_.Trim()

    if ($line.Length -eq 0 -or $line.StartsWith('#')) {
        return
    }

    $idx = $line.IndexOf('=')

    if ($idx -lt 1) {
        return
    }

    $name = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    Set-Item -Path ("Env:$name") -Value $value
}

if (-not [string]::IsNullOrWhiteSpace($env:AZURE_OPENAI_ENDPOINT)) {
    $env:AZURE_OPENAI_ENDPOINT = Normalize-AzureOpenAiEndpoint -Endpoint $env:AZURE_OPENAI_ENDPOINT
}

if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT)) {
    $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT = Normalize-AzureOpenAiEndpoint -Endpoint $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT
}

if (-not [string]::IsNullOrWhiteSpace($env:AZURE_OPENAI_API_KEY) -and [string]::IsNullOrWhiteSpace($env:ARCHLUCID_REAL_AOAI_TEST_KEY)) {
    $env:ARCHLUCID_REAL_AOAI_TEST_KEY = $env:AZURE_OPENAI_API_KEY
}

if (-not [string]::IsNullOrWhiteSpace($env:AZURE_OPENAI_ENDPOINT) -and [string]::IsNullOrWhiteSpace($env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT)) {
    $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT = $env:AZURE_OPENAI_ENDPOINT
}

if (-not [string]::IsNullOrWhiteSpace($env:AZURE_OPENAI_DEPLOYMENT_NAME) -and [string]::IsNullOrWhiteSpace($env:ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT)) {
    $env:ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT = $env:AZURE_OPENAI_DEPLOYMENT_NAME
}
