<#
.SYNOPSIS
    Command-line entry for the SecureNow Azure inventory package collector.

.DESCRIPTION
    Convenience wrapper around scripts/azure/Run-SecureNowAzureExtractor.ps1, which installs Az
    modules when needed, signs in when no Azure context exists, writes
    ./securenow-azure-package.zip by default, and calls Get-SecureNowAzurePackage.ps1 with
    -IncludeAppSettingsHosts enabled.

    Upload the resulting ZIP manually in SecureNow — this script never sends data to SecureNow.

.EXAMPLE
    .\scripts\Invoke-SecureNowAzurePackage.ps1 -SubscriptionId '<guid>' -AuthenticationMethod Browser

.EXAMPLE
    .\scripts\Invoke-SecureNowAzurePackage.ps1 -TenantId '<guid>' -SubscriptionId '<guid>' -SkipCost

.EXAMPLE
    .\scripts\GetHawaii.ps1
    Hawaii non-prod shortcut (same quick-start path with fixed tenant/subscription).
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
    [int] $CostTimeoutSeconds = 180,

    [Parameter(Mandatory = $false)]
    [switch] $SkipCost,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeCost,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeRetailPrices,

    [Parameter(Mandatory = $false)]
    [ValidateSet("Browser", "Credential", "DeviceCode", "")]
    [string] $AuthenticationMethod = "",

    [Parameter(Mandatory = $false)]
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[string]$quickStartScript = Join-Path $PSScriptRoot "azure/Run-SecureNowAzureExtractor.ps1"

if (-not (Test-Path -LiteralPath $quickStartScript))
{
    throw "Missing SecureNow extractor quick start at '$quickStartScript'."
}

[hashtable]$quickStartParams = @{
    CostTimeoutSeconds = $CostTimeoutSeconds
    SkipConnect = [bool]$SkipConnect
    SkipModuleInstall = [bool]$SkipModuleInstall
    NonInteractive = [bool]$NonInteractive
    SkipCost = [bool]$SkipCost
    IncludeCost = [bool]$IncludeCost
    IncludeRetailPrices = [bool]$IncludeRetailPrices
    DryRun = [bool]$DryRun
}

if (-not ([string]::IsNullOrWhiteSpace($TenantId)))
{
    $quickStartParams["TenantId"] = $TenantId.Trim()
}

if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
{
    $quickStartParams["SubscriptionId"] = $SubscriptionId.Trim()
}

if (-not ([string]::IsNullOrWhiteSpace($OutputPath)))
{
    $quickStartParams["OutputPath"] = $OutputPath.Trim()
}

if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
{
    $quickStartParams["ResourceGroupScope"] = $ResourceGroupScope.Trim()
}

if (-not ([string]::IsNullOrWhiteSpace($AuthenticationMethod)))
{
    $quickStartParams["AuthenticationMethod"] = $AuthenticationMethod
}

& $quickStartScript @quickStartParams

if (-not $?)
{
    exit 1
}

if (Test-Path -Path "Variable:LASTEXITCODE")
{
    exit $LASTEXITCODE
}

exit 0
