<#
.SYNOPSIS
    Runs the SecureNow Azure extractor for the Hawaii non-production subscription.

.DESCRIPTION
    This is the repeatable equivalent of the recommended Hawaii command:
    browser authentication, explicit tenant selection, and no Cost Management query.
#>
#Requires -Version 7.0

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

[string]$extractorScript = Join-Path $PSScriptRoot 'azure/Run-SecureNowAzureExtractor.ps1'

if (-not (Test-Path -LiteralPath $extractorScript))
{
    throw "Missing SecureNow extractor script at '$extractorScript'."
}

& $extractorScript `
    -TenantId '13af8028-bc99-4f21-a8df-6072feb323be' `
    -SubscriptionId '0966098b-4d6c-4f09-af1b-965bc2a2ad1d' `
    -AuthenticationMethod Browser `
    -SkipCost

if (-not $?)
{
    exit 1
}

if (Test-Path -Path 'Variable:LASTEXITCODE')
{
    exit $LASTEXITCODE
}

exit 0
