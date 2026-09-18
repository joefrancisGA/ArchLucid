# Azure Automation PowerShell 7.2 runbook — customer-owned scheduled Azure extractor.
# Downloads the pinned collector ZIP from customer storage, then collects and uploads.
#Requires -Version 7.2

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-ArchLucidAutomationTextVariable
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [string] $DefaultValue = ""
    )

    try
    {
        [object]$raw = Get-AutomationVariable -Name $Name

        if ($null -eq $raw)
        {
            return $DefaultValue
        }

        [string]$text = "$raw".Trim()

        if ([string]::IsNullOrWhiteSpace($text))
        {
            return $DefaultValue
        }

        return $text
    }
    catch
    {
        return $DefaultValue
    }
}

function Convert-ArchLucidRunbookAccessTokenToPlaintext
{
    param(
        $Token
    )

    if ($null -eq $Token)
    {
        return ""
    }

    # Az.Accounts 5+ returns SecureString; older modules returned a raw string.
    if ($Token -is [securestring])
    {
        [System.IntPtr]$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)

        try
        {
            return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
        }
        finally
        {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }

    return "$Token".Trim()
}

function Get-ArchLucidRunbookBooleanVariable
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [bool] $DefaultValue = $true
    )

    [string]$text = Get-ArchLucidAutomationTextVariable -Name $Name -DefaultValue ""

    if ([string]::IsNullOrWhiteSpace($text))
    {
        return $DefaultValue
    }

    if ($text -eq "1" -or $text -eq "true" -or $text -eq "True" -or $text -eq "TRUE")
    {
        return $true
    }

    return $false
}

[string]$subscriptionId = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_AZURE_SUBSCRIPTION_ID"
[string]$apiBaseUrl = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_API_BASE_URL"
[string]$tenantId = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_TENANT_ID"
[string]$workspaceId = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_WORKSPACE_ID"
[string]$projectId = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_PROJECT_ID"
[string]$runId = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_RUN_ID"
[string]$keyVaultName = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_KEY_VAULT_NAME"
[string]$keyVaultSecretName = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_KEY_VAULT_SECRET_NAME" -DefaultValue "archlucid-api-key"
[string]$storageAccountName = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_COLLECTOR_STORAGE_ACCOUNT"
[string]$containerName = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_COLLECTOR_CONTAINER" -DefaultValue "extractor-scripts"
[string]$blobName = Get-ArchLucidAutomationTextVariable -Name "ARCHLUCID_COLLECTOR_BLOB_NAME" -DefaultValue "archlucid-scheduled-extractor-scripts.zip"
[bool]$includeCost = Get-ArchLucidRunbookBooleanVariable -Name "ARCHLUCID_INCLUDE_COST" -DefaultValue $true

if ([string]::IsNullOrWhiteSpace($subscriptionId))
{
    throw "Automation variable ARCHLUCID_AZURE_SUBSCRIPTION_ID is required."
}

if ([string]::IsNullOrWhiteSpace($apiBaseUrl))
{
    throw "Automation variable ARCHLUCID_API_BASE_URL is required."
}

if ([string]::IsNullOrWhiteSpace($storageAccountName))
{
    throw "Automation variable ARCHLUCID_COLLECTOR_STORAGE_ACCOUNT is required."
}

$null = Connect-AzAccount -Identity -ErrorAction Stop

[object]$storageToken = Get-AzAccessToken -ResourceUrl "https://storage.azure.com" -ErrorAction Stop
[string]$storageTokenText = Convert-ArchLucidRunbookAccessTokenToPlaintext -Token $storageToken.Token

if ([string]::IsNullOrWhiteSpace($storageTokenText))
{
    throw "Storage access token was empty."
}

[string]$workRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-scheduled-extractor-" + [guid]::NewGuid().ToString("N"))
[string]$zipPath = Join-Path $workRoot "collector.zip"
[string]$expandPath = Join-Path $workRoot "scripts"

New-Item -ItemType Directory -Path $expandPath -Force | Out-Null

[string]$blobUri = "https://$storageAccountName.blob.core.windows.net/$containerName/$blobName"
[hashtable]$blobHeaders = @{
    Authorization  = "Bearer $storageTokenText"
    "x-ms-version" = "2023-11-03"
}

Invoke-WebRequest -Method GET -Uri $blobUri -Headers $blobHeaders -OutFile $zipPath -ErrorAction Stop
Expand-Archive -LiteralPath $zipPath -DestinationPath $expandPath -Force

[string]$orchestrator = Join-Path $expandPath "Invoke-ArchLucidScheduledAzureExtractor.ps1"

if (-not (Test-Path -LiteralPath $orchestrator))
{
    throw "Collector ZIP is missing Invoke-ArchLucidScheduledAzureExtractor.ps1."
}

[hashtable]$invokeParams = @{
    SubscriptionId       = $subscriptionId
    ApiBaseUrl           = $apiBaseUrl
    TenantId             = $tenantId
    WorkspaceId          = $workspaceId
    ProjectId            = $projectId
    RunId                = $runId
    KeyVaultName         = $keyVaultName
    KeyVaultSecretName   = $keyVaultSecretName
    SkipConnect          = $true
}

if ($includeCost)
{
    $invokeParams["IncludeCost"] = $true
}

& $orchestrator @invokeParams
