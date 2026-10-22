#Requires -Version 5.1
<#
.SYNOPSIS
  Initiate ACS DNS verification for archlucid.net and link the domain when verified.

.DESCRIPTION
  Run after publishing DNS records at your DNS host (GoDaddy for archlucid.net).
  On success, links archlucid.net to the dev Communication Service and updates ArchLucid.Api secrets.
#>
[CmdletBinding()]
param(
    [string] $ResourceGroup = 'rg-ArchLucid-dev',
    [string] $EmailServiceName = 'archlucid-dev-email-8aa56f3b',
    [string] $CommunicationServiceName = 'archlucid-dev-comm-8aa56f3b',
    [string] $FromAddress = 'noreply@archlucid.net',
    [string] $OperatorBaseUrl = 'http://localhost:3000',
    [string] $ProjectPath = 'ArchLucid.Api/ArchLucid.Api.csproj'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$azCandidates = @(
    'C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd',
    'C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd'
)
$az = $azCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $az) {
    $cmd = Get-Command az -ErrorAction SilentlyContinue
    if ($cmd) { $az = $cmd.Source }
}

if (-not $az) {
    throw 'Azure CLI (az) not found.'
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $repoRoot

$verificationTypes = @('Domain', 'SPF', 'DKIM', 'DKIM2')

foreach ($type in $verificationTypes) {
    Write-Host "Initiating $type verification..."
    & $az communication email domain initiate-verification `
        --domain-name archlucid.net `
        --email-service-name $EmailServiceName `
        --resource-group $ResourceGroup `
        --verification-type $type | Out-Null
}

Start-Sleep -Seconds 15

$domain = & $az communication email domain show `
    --domain-name archlucid.net `
    --email-service-name $EmailServiceName `
    --resource-group $ResourceGroup `
    -o json | ConvertFrom-Json

Write-Host ''
Write-Host 'Verification status:'
foreach ($entry in $domain.verificationStates.PSObject.Properties) {
    Write-Host ("  {0}: {1}" -f $entry.Name, $entry.Value.status)
}

$required = @('Domain', 'SPF', 'DKIM', 'DKIM2')
$pending = @()

foreach ($name in $required) {
    $status = $domain.verificationStates.$name.status

    if ($status -ne 'Verified') {
        $pending += $name
    }
}

if ($pending.Count -gt 0) {
    Write-Host ''
    Write-Host "DNS not fully verified yet: $($pending -join ', ')" -ForegroundColor Yellow
    Write-Host 'Publish the records in .local/owner/acs-archlucid-net-dns.md, wait a few minutes, then re-run this script.'
    exit 1
}

Write-Host ''
Write-Host 'Domain verified. Linking to Communication Service...' -ForegroundColor Green

$sub = (& $az account show --query id -o tsv).Trim()
$managedDomainId = "/subscriptions/$sub/resourceGroups/$ResourceGroup/providers/Microsoft.Communication/emailServices/$EmailServiceName/domains/AzureManagedDomain"
$customDomainId = "/subscriptions/$sub/resourceGroups/$ResourceGroup/providers/Microsoft.Communication/emailServices/$EmailServiceName/domains/archlucid.net"

& $az communication update `
    --name $CommunicationServiceName `
    --resource-group $ResourceGroup `
    --linked-domains $managedDomainId $customDomainId | Out-Null

$endpoint = "https://$((& $az communication show --name $CommunicationServiceName --resource-group $ResourceGroup --query hostName -o tsv).Trim())"

& "$PSScriptRoot\configure-local-email.ps1" `
    -UseAcs `
    -AcsEndpoint $endpoint `
    -FromAddress $FromAddress `
    -FromDisplayName 'ArchLucid' `
    -OperatorBaseUrl $OperatorBaseUrl `
    -ProjectPath $ProjectPath

Write-Host ''
Write-Host 'Done. Restart ArchLucid.Api and send a new workspace invite.' -ForegroundColor Green
