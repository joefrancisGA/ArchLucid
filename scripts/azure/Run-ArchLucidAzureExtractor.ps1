<#
.SYNOPSIS
    One-command Azure extractor quick start for ArchLucid Tier 1 ingest.

.DESCRIPTION
    Installs Az modules when missing (unless -SkipModuleInstall), signs in when no Azure
    context exists (unless -SkipConnect), resolves the active subscription when
    -SubscriptionId is omitted, writes ./archlucid-azure-package.zip by default, and
    delegates to Get-ArchLucidAzurePackage.ps1 with -IncludeCost enabled.

.NOTES
    Upload the resulting ZIP manually in ArchLucid — this script never sends data to ArchLucid.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
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
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[string]$scriptRoot = Split-Path -Parent $PSCommandPath
[string]$extractorScript = Join-Path $scriptRoot "Get-ArchLucidAzurePackage.ps1"

if (-not (Test-Path -LiteralPath $extractorScript))
{
    throw "Missing extractor script at '$extractorScript'. Run from an ArchLucid repository checkout."
}

. (Join-Path $scriptRoot "ArchLucid.ExtractorQuickStart.helpers.ps1")

Ensure-ArchLucidAzModules -SkipModuleInstall:$SkipModuleInstall
[string]$resolvedSubscriptionId = Resolve-ArchLucidAzureExtractorSubscriptionId `
    -SubscriptionId $SubscriptionId `
    -SkipConnect:$SkipConnect

[string]$resolvedOutputPath = Resolve-ArchLucidAzureExtractorOutputPath -OutputPath $OutputPath

Write-Host "ArchLucid Azure extractor quick start" -ForegroundColor Cyan
Write-Host ("  Subscription: {0}" -f $resolvedSubscriptionId)
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
exit $LASTEXITCODE
