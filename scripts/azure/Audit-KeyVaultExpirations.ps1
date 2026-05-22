<#
.SYNOPSIS
    Lists Azure Key Vault secrets, certificates, and keys expiring within a warning window.

.DESCRIPTION
    Read-only audit for operations teams. Emits structured warnings to stdout (JSON when -AsJson).

.PARAMETER VaultName
    Key Vault name (not the full URI).

.PARAMETER DaysAhead
    Flag items expiring on or before UTC now + this many days. Default 30.

.PARAMETER AsJson
    Emit a single JSON object instead of human-readable lines.

.EXAMPLE
    ./Audit-KeyVaultExpirations.ps1 -VaultName my-kv -DaysAhead 30
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $VaultName,

    [Parameter(Mandatory = $false)]
    [int] $DaysAhead = 30,

    [Parameter(Mandatory = $false)]
    [switch] $AsJson
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Module -ListAvailable -Name Az.KeyVault))
{
    throw "Az.KeyVault module is required. Install: Install-Module Az -Scope CurrentUser"
}

Import-Module Az.KeyVault -ErrorAction Stop

$cutoffUtc = (Get-Date).ToUniversalTime().AddDays($DaysAhead)
$findings = [System.Collections.Generic.List[object]]::new()

function Add-Finding([string] $Kind, [string] $Name, [datetime] $ExpiresUtc)
{
    if ($ExpiresUtc -gt $cutoffUtc)
    {
        return
    }

    [void]$findings.Add([ordered]@{
            kind = $Kind
            name = $Name
            expiresUtc = $ExpiresUtc.ToString("o")
            vaultName = $VaultName
        })
}

$secrets = Get-AzKeyVaultSecret -VaultName $VaultName -ErrorAction SilentlyContinue

foreach ($secret in @($secrets))
{
    if ($null -eq $secret.Expires)
    {
        continue
    }

    Add-Finding -Kind "secret" -Name $secret.Name -ExpiresUtc $secret.Expires
}

$certificates = Get-AzKeyVaultCertificate -VaultName $VaultName -ErrorAction SilentlyContinue

foreach ($certificate in @($certificates))
{
    if ($null -eq $certificate.Expires)
    {
        continue
    }

    Add-Finding -Kind "certificate" -Name $certificate.Name -ExpiresUtc $certificate.Expires
}

$keys = Get-AzKeyVaultKey -VaultName $VaultName -ErrorAction SilentlyContinue

foreach ($key in @($keys))
{
    if ($null -eq $key.Expires)
    {
        continue
    }

    Add-Finding -Kind "key" -Name $key.Name -ExpiresUtc $key.Expires
}

if ($AsJson)
{
    $payload = [ordered]@{
        vaultName = $VaultName
        cutoffUtc = $cutoffUtc.ToString("o")
        daysAhead = $DaysAhead
        expiringCount = $findings.Count
        items = @($findings)
    }

    Write-Output ($payload | ConvertTo-Json -Depth 6)

    if ($findings.Count -gt 0)
    {
        exit 2
    }

    exit 0
}

if ($findings.Count -eq 0)
{
    Write-Host "No Key Vault items in '$VaultName' expire on or before $($cutoffUtc.ToString('o'))."

    exit 0
}

Write-Warning "Key Vault '$VaultName' has $($findings.Count) item(s) expiring on or before $($cutoffUtc.ToString('o')):"

foreach ($item in $findings)
{
    Write-Host "  [$($item.kind)] $($item.name) -> $($item.expiresUtc)"
}

exit 2
