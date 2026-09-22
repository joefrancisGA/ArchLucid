<#
.SYNOPSIS
    One-command Azure extractor quick start for SecureNow Tier 1 ingest.

.DESCRIPTION
    Installs Az modules when missing (unless -SkipModuleInstall), signs in when no Azure
    context exists (unless -SkipConnect), prompts for a sign-in method and subscription
    by friendly name when -SubscriptionId is omitted (unless -NonInteractive), writes
    ./securenow-azure-package.zip by default, and delegates to Get-SecureNowAzurePackage.ps1
    with -IncludeCost, -IncludeRetailPrices, and -IncludeAppSettingsHosts enabled.
    Azure CLI is signed in from the same Azure PowerShell session so cost collection can
    succeed without a separate az login.

.NOTES
    Upload the resulting ZIP manually in SecureNow — this script never sends data to SecureNow.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string] $TenantId = "",

    [Parameter(Mandatory = $false)]
    [string] $SubscriptionId = "",

    [Parameter(Mandatory = $false)]
    [string] $OutputPath = "",

    [Parameter(Mandatory = $false)]
    [string] $ResourceGroupScope = "",

    [Parameter(Mandatory = $false)]
    [switch] $SkipConnect,

    [Parameter(Mandatory = $false)]
    [switch] $SkipModuleInstall,

    [Parameter(Mandatory = $false)]
    [switch] $NonInteractive,

    [Parameter(Mandatory = $false)]
    [ValidateSet("Browser", "Credential", "DeviceCode", "")]
    [string] $AuthenticationMethod = "",

    [Parameter(Mandatory = $false)]
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[string]$scriptRoot = Split-Path -Parent $PSCommandPath
[string]$extractorScript = Join-Path $scriptRoot "Get-SecureNowAzurePackage.ps1"

if (-not (Test-Path -LiteralPath $extractorScript))
{
    throw "Missing extractor script at '$extractorScript'. Run from a SecureNow repository checkout."
}

. (Join-Path $scriptRoot "ArchLucid.ExtractorQuickStart.helpers.ps1")

Ensure-ArchLucidAzModules -SkipModuleInstall:$SkipModuleInstall
[string]$resolvedSubscriptionId = Resolve-ArchLucidAzureExtractorSubscriptionId `
    -TenantId $TenantId `
    -SubscriptionId $SubscriptionId `
    -SkipConnect:$SkipConnect `
    -NonInteractive:$NonInteractive `
    -AuthenticationMethod $AuthenticationMethod

[string]$resolvedOutputPath = Resolve-SecureNowAzureExtractorOutputPath -OutputPath $OutputPath
[string]$resolvedSubscriptionName = Resolve-ArchLucidAzureSubscriptionDisplayName -SubscriptionId $resolvedSubscriptionId

Write-Host "SecureNow Azure extractor quick start" -ForegroundColor Cyan

if (-not ([string]::IsNullOrWhiteSpace($TenantId)))
{
    Write-Host ("  Tenant:       {0}" -f $TenantId.Trim())
}

if (-not ([string]::IsNullOrWhiteSpace($resolvedSubscriptionName)))
{
    Write-Host ("  Subscription: {0} [{1}]" -f $resolvedSubscriptionName, $resolvedSubscriptionId)
}
else
{
    Write-Host ("  Subscription: {0}" -f $resolvedSubscriptionId)
}
Write-Host ("  Output ZIP:   {0}" -f $resolvedOutputPath)

if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
{
    Write-Host ("  Resource group filter: {0}" -f $ResourceGroupScope.Trim())
}

Write-Host ""

[hashtable]$extractorParams = @{
    SubscriptionId = $resolvedSubscriptionId
    OutputPath = $resolvedOutputPath
    IncludeCost = $true
    IncludeRetailPrices = $true
    IncludeAppSettingsHosts = $true
}

if (-not ([string]::IsNullOrWhiteSpace($TenantId)))
{
    $extractorParams["TenantId"] = $TenantId.Trim()
}

if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
{
    $extractorParams["ResourceGroupScope"] = $ResourceGroupScope.Trim()
}

if ($DryRun)
{
    $extractorParams["DryRun"] = $true
}

& $extractorScript @extractorParams

if (-not $?)
{
    exit 1
}

if (Test-Path -Path 'Variable:LASTEXITCODE')
{
    exit $LASTEXITCODE
}

exit 0
