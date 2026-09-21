<#
.SYNOPSIS
    Uploads a schema-versioned Azure extractor ZIP to ArchLucid over HTTP.

.DESCRIPTION
    Customer-owned scheduled agents (Automation runbook, Function timer, CI) call this
    instead of a UI pull or interactive CLI session. Reuses POST /v1/azure-extractor/upload.

.NOTES
    Store the API key in Key Vault or an encrypted automation variable. Never log the key.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $PackagePath,

    [Parameter(Mandatory = $true)]
    [string] $ApiBaseUrl,

    [Parameter(Mandatory = $false)]
    [string] $ApiKey = "",

    [Parameter(Mandatory = $false)]
    [string] $BearerToken = "",

    [Parameter(Mandatory = $false)]
    [string] $TenantId = "",

    [Parameter(Mandatory = $false)]
    [string] $WorkspaceId = "",

    [Parameter(Mandatory = $false)]
    [string] $ProjectId = "",

    [Parameter(Mandatory = $false)]
    [string] $RunId = "",

    [Parameter(Mandatory = $false)]
    [string] $KeyVaultName = "",

    [Parameter(Mandatory = $false)]
    [string] $KeyVaultSecretName = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "ArchLucid.ScheduledExtractor.helpers.ps1")

[string]$resolvedApiKey = Resolve-ArchLucidScheduledExtractorApiKey `
    -ApiKey $ApiKey `
    -KeyVaultName $KeyVaultName `
    -KeyVaultSecretName $KeyVaultSecretName

[object]$response = Send-ArchLucidAzureExtractorPackageFromPath `
    -PackagePath $PackagePath `
    -ApiBaseUrl $ApiBaseUrl `
    -ApiKey $resolvedApiKey `
    -BearerToken $BearerToken `
    -TenantId $TenantId `
    -WorkspaceId $WorkspaceId `
    -ProjectId $ProjectId `
    -RunId $RunId

Write-Host ("Uploaded extractor package. HTTP {0}." -f [int]$response.StatusCode) -ForegroundColor Green
