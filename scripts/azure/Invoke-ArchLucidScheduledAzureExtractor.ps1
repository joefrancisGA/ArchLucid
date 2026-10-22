<#
.SYNOPSIS
    Collects read-only Azure inventory and uploads the ZIP to ArchLucid on a schedule.

.DESCRIPTION
    Preferred production path when operators should not pull inventory from a command line
    or UI. Designed for Azure Automation runbooks and Azure Function timer triggers.
    Reuses Get-ArchLucidAzurePackage.ps1 — it does not invent a second collector.

.NOTES
    Sign in with a managed identity that has Reader + Cost Management Reader.
    ArchLucid receives only the resulting ZIP through POST /v1/azure-extractor/upload.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $SubscriptionId,

    [Parameter(Mandatory = $true)]
    [string] $ApiBaseUrl,

    [Parameter(Mandatory = $false)]
    [string] $TenantId = "",

    [Parameter(Mandatory = $false)]
    [string] $WorkspaceId = "",

    [Parameter(Mandatory = $false)]
    [string] $ProjectId = "",

    [Parameter(Mandatory = $false)]
    [string] $RunId = "",

    [Parameter(Mandatory = $false)]
    [string] $ApiKey = "",

    [Parameter(Mandatory = $false)]
    [string] $BearerToken = "",

    [Parameter(Mandatory = $false)]
    [string] $KeyVaultName = "",

    [Parameter(Mandatory = $false)]
    [string] $KeyVaultSecretName = "",

    [Parameter(Mandatory = $false)]
    [string] $ManagedIdentityClientId = "",

    [Parameter(Mandatory = $false)]
    [string] $CollectorScriptPath = "",

    [Parameter(Mandatory = $false)]
    [string] $OutputPath = "",

    [Parameter(Mandatory = $false)]
    [switch] $IncludeCost,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeRetailPrices,

    [Parameter(Mandatory = $false)]
    [switch] $SkipConnect,

    [Parameter(Mandatory = $false)]
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "ArchLucid.ScheduledExtractor.helpers.ps1")

if (-not $SkipConnect)
{
    Connect-ArchLucidScheduledExtractorManagedIdentity `
        -ClientId $ManagedIdentityClientId `
        -TenantId $TenantId
}

[string]$collectorScript = Get-ArchLucidScheduledExtractorCollectorScriptPath `
    -CollectorScriptPath $CollectorScriptPath

[string]$resolvedOutputPath = "$OutputPath".Trim()

if ([string]::IsNullOrWhiteSpace($resolvedOutputPath))
{
    $resolvedOutputPath = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-azure-package-{0}.zip" -f [guid]::NewGuid().ToString("N"))
}

Write-Host "ArchLucid scheduled Azure extractor" -ForegroundColor Cyan
Write-Host ("  Subscription: {0}" -f $SubscriptionId.Trim())
Write-Host ("  Output ZIP:   {0}" -f $resolvedOutputPath)

Invoke-ArchLucidScheduledAzureExtractorCollection `
    -CollectorScriptPath $collectorScript `
    -SubscriptionId $SubscriptionId `
    -OutputPath $resolvedOutputPath `
    -TenantId $TenantId `
    -IncludeCost:$IncludeCost `
    -IncludeRetailPrices:$IncludeRetailPrices `
    -DryRun:$DryRun

if ($DryRun)
{
    Write-Host "Dry run: collection finished; upload skipped." -ForegroundColor Yellow

    return
}

[string]$resolvedApiKey = Resolve-ArchLucidScheduledExtractorApiKey `
    -ApiKey $ApiKey `
    -KeyVaultName $KeyVaultName `
    -KeyVaultSecretName $KeyVaultSecretName

[object]$response = Send-ArchLucidAzureExtractorPackageFromPath `
    -PackagePath $resolvedOutputPath `
    -ApiBaseUrl $ApiBaseUrl `
    -ApiKey $resolvedApiKey `
    -BearerToken $BearerToken `
    -TenantId $TenantId `
    -WorkspaceId $WorkspaceId `
    -ProjectId $ProjectId `
    -RunId $RunId

Write-Host ("Scheduled extractor upload completed. HTTP {0}." -f [int]$response.StatusCode) -ForegroundColor Green
