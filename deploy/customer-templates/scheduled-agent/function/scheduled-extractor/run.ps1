# Azure Function timer host for the same scheduled extractor orchestrator.
# Copy scripts/azure/*.ps1 used by the collector into this function app (see README).
#Requires -Version 7.0

param($Timer)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

[string]$orchestrator = Join-Path $PSScriptRoot "Invoke-ArchLucidScheduledAzureExtractor.ps1"

if (-not (Test-Path -LiteralPath $orchestrator))
{
    $orchestrator = Join-Path (Split-Path -Parent $PSScriptRoot) "Invoke-ArchLucidScheduledAzureExtractor.ps1"
}

if (-not (Test-Path -LiteralPath $orchestrator))
{
    throw "Invoke-ArchLucidScheduledAzureExtractor.ps1 must be deployed next to this function."
}

[hashtable]$invokeParams = @{
    SubscriptionId     = "$env:ARCHLUCID_AZURE_SUBSCRIPTION_ID"
    ApiBaseUrl         = "$env:ARCHLUCID_API_BASE_URL"
    TenantId           = "$env:ARCHLUCID_TENANT_ID"
    WorkspaceId        = "$env:ARCHLUCID_WORKSPACE_ID"
    ProjectId          = "$env:ARCHLUCID_PROJECT_ID"
    RunId              = "$env:ARCHLUCID_RUN_ID"
    KeyVaultName       = "$env:ARCHLUCID_KEY_VAULT_NAME"
    KeyVaultSecretName = "$env:ARCHLUCID_KEY_VAULT_SECRET_NAME"
    SkipConnect        = $true
}

if ("$env:ARCHLUCID_INCLUDE_COST" -ne "false")
{
    $invokeParams["IncludeCost"] = $true
}

& $orchestrator @invokeParams
