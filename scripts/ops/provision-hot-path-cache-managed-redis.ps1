<#
.SYNOPSIS
  TB-2141: provision Azure Managed Redis (redisenterprise) for HotPathCache L2 when classic Cache for Redis is unavailable.
.DESCRIPTION
  Mirrors the DEV path documented in TB-2120. Prints connection-string wiring steps for terraform-container-apps.
  Does not mutate Container Apps — run enable-hot-path-cache-redis-checklist.ps1 after apply.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('staging', 'production')]
    [string] $Environment,

    [string] $SubscriptionId = "",
    [string] $ResourceGroupName = "",
    [string] $Location = "centralus",
    [string] $ClusterName = "",
    [string] $SkuName = "Balanced_B0",
    [switch] $SkipConnectionString
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-DefaultResourceGroupName {
    param([string] $EnvName)

    if ($EnvName -eq 'staging') {
        return 'rg-archlucid-redis-staging'
    }

    return 'rg-archlucid-redis-prod'
}

function Get-DefaultClusterName {
    param([string] $EnvName)

    if ($EnvName -eq 'staging') {
        return 'redis-archlucid-staging'
    }

    return 'redis-archlucid-prod'
}

if ([string]::IsNullOrWhiteSpace($ResourceGroupName)) {
    $ResourceGroupName = Get-DefaultResourceGroupName -EnvName $Environment
}

if ([string]::IsNullOrWhiteSpace($ClusterName)) {
    $ClusterName = Get-DefaultClusterName -EnvName $Environment
}

Write-Host "TB-2141 — provision Azure Managed Redis for HotPathCache ($Environment)"
Write-Host "Guide: docs/library/SCALE_TIER_CACHE_GUIDE.md"
Write-Host ""

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI (az) is required.'
}

if ([string]::IsNullOrWhiteSpace($SubscriptionId)) {
    $SubscriptionId = (az account show --query id -o tsv).Trim()
}

az account set --subscription $SubscriptionId | Out-Null

$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq 'false') {

    if ($PSCmdlet.ShouldProcess($ResourceGroupName, 'Create resource group')) {
        az group create --name $ResourceGroupName --location $Location --tags environment=$Environment product=archlucid | Out-Null
    }
}

$existingCluster = az redisenterprise show --cluster-name $ClusterName --resource-group $ResourceGroupName 2>$null
if ($LASTEXITCODE -ne 0) {

    if ($PSCmdlet.ShouldProcess($ClusterName, 'Create redisenterprise cluster')) {
        az redisenterprise create `
            --cluster-name $ClusterName `
            --resource-group $ResourceGroupName `
            --location $Location `
            --sku $SkuName `
            --tags environment=$Environment product=archlucid | Out-Null
    }
}

$databaseName = 'default'
$dbExists = az redisenterprise database show --cluster-name $ClusterName --resource-group $ResourceGroupName --database-name $databaseName 2>$null
if ($LASTEXITCODE -ne 0) {

    if ($PSCmdlet.ShouldProcess($databaseName, 'Create redisenterprise database')) {
        az redisenterprise database create `
            --cluster-name $ClusterName `
            --resource-group $ResourceGroupName `
            --database-name $databaseName `
            --client-protocol Encrypted `
            --port 10000 `
            --clustering-policy EnterpriseCluster | Out-Null
    }
}

if (-not $SkipConnectionString) {
    $connectionString = (az redisenterprise database list-keys `
        --cluster-name $ClusterName `
        --resource-group $ResourceGroupName `
        --database-name $databaseName `
        --query primaryKey -o tsv).Trim()

    if ([string]::IsNullOrWhiteSpace($connectionString)) {
        throw 'Managed Redis primary key was empty — check cluster/database provisioning.'
    }

    Write-Host ""
    Write-Host 'Next: set infra/terraform-container-apps hot_path_cache_redis_connection_string to the StackExchange.Redis connection string for this cluster.'
    Write-Host '  (hostname from: az redisenterprise show --cluster-name <name> --resource-group <rg> --query hostName -o tsv)'
    Write-Host '  Then: terraform apply -var-file=<env>.tfvars in infra/terraform-container-apps'
    Write-Host '  Verify: scripts/ops/enable-hot-path-cache-redis-checklist.ps1 -ApiBaseUrl <api-host>'
    Write-Host ""
    Write-Host 'Primary access key retrieved (not echoed). Store in Key Vault or TF sensitive var only.'
}

exit 0
