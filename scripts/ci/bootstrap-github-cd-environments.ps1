#Requires -Version 5.1
<#
.SYNOPSIS
  Bootstraps GitHub Environments (dev, staging, production) for ArchLucid CD.

.DESCRIPTION
  Copies the same Azure/OIDC secrets into all three environments (same targets for now).
  Sets repository variables for dev maintenance-window rollback defaults.
  Never prints secret values.

  Requires: gh CLI authenticated with repo admin (gh auth login).

.EXAMPLE
  .\scripts\ci\bootstrap-github-cd-environments.ps1 `
    -AdminApiKey '<container-app-admin-key>' `
    -AzureClientId '<app-id>' `
    -AzureTenantId '<tenant>' `
    -AzureSubscriptionId '<sub>' `
    -AcrLoginServer 'acrarchluciddev.azurecr.io' `
    -AzureResourceGroup 'rg-ArchLucid-dev' `
    -ContainerAppApiName 'archlucid-api' `
    -ContainerAppMarketingUiName 'archlucid-ui-marketing' `
    -SmokeTestBaseUrl 'https://archlucid-api.<region>.azurecontainerapps.io'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$AdminApiKey,

    [string]$AzureClientId,
    [string]$AzureTenantId,
    [string]$AzureSubscriptionId,
    [string]$AcrLoginServer,
    [string]$AcrName,
    [string]$AzureResourceGroup,
    [string]$ContainerAppApiName = 'archlucid-api',
    [string]$ContainerAppWorkerName = 'archlucid-worker',
    [string]$ContainerAppUiName = 'archlucid-ui',
    [string]$ContainerAppMarketingUiName = 'archlucid-ui-marketing',
    [string]$SmokeTestBaseUrl,
    [string]$TfWorkingDirectory = 'infra/terraform-container-apps',

    [string]$AlertSmsPhone,
    [string]$AlertVoicePhone,

    [string[]]$Environments = @('dev', 'staging', 'production')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-GhReady {
    $null = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw 'gh CLI is not authenticated. Run: gh auth login'
    }
}

function Set-EnvSecretIfPresent {
    param(
        [string]$Environment,
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return
    }

    $Value | gh secret set $Name --env $Environment
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to set environment secret $Name on $Environment"
    }

    Write-Host "Set environment secret $Name on $Environment"
}

function Set-RepoVariable {
    param(
        [string]$Name,
        [string]$Value
    )

    gh variable set $Name --body $Value | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to set repository variable $Name"
    }

    Write-Host "Set repository variable $Name"
}

function Set-RepoSecretIfPresent {
    param(
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return
    }

    $Value | gh secret set $Name
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to set repository secret $Name"
    }

    Write-Host "Set repository secret $Name"
}

Assert-GhReady

foreach ($envName in $Environments) {
    Write-Host "=== Environment: $envName ==="

    Set-EnvSecretIfPresent -Environment $envName -Name 'ARCHLUCID_API_KEY' -Value $AdminApiKey
    Set-EnvSecretIfPresent -Environment $envName -Name 'AZURE_CLIENT_ID' -Value $AzureClientId
    Set-EnvSecretIfPresent -Environment $envName -Name 'AZURE_TENANT_ID' -Value $AzureTenantId
    Set-EnvSecretIfPresent -Environment $envName -Name 'AZURE_SUBSCRIPTION_ID' -Value $AzureSubscriptionId
    Set-EnvSecretIfPresent -Environment $envName -Name 'ACR_LOGIN_SERVER' -Value $AcrLoginServer
    Set-EnvSecretIfPresent -Environment $envName -Name 'ACR_NAME' -Value $AcrName
    Set-EnvSecretIfPresent -Environment $envName -Name 'AZURE_RESOURCE_GROUP' -Value $AzureResourceGroup
    Set-EnvSecretIfPresent -Environment $envName -Name 'CONTAINER_APP_API_NAME' -Value $ContainerAppApiName
    Set-EnvSecretIfPresent -Environment $envName -Name 'CONTAINER_APP_WORKER_NAME' -Value $ContainerAppWorkerName
    Set-EnvSecretIfPresent -Environment $envName -Name 'CONTAINER_APP_UI_NAME' -Value $ContainerAppUiName
    Set-EnvSecretIfPresent -Environment $envName -Name 'CONTAINER_APP_MARKETING_UI_NAME' -Value $ContainerAppMarketingUiName
    Set-EnvSecretIfPresent -Environment $envName -Name 'SMOKE_TEST_BASE_URL' -Value $SmokeTestBaseUrl
    Set-EnvSecretIfPresent -Environment $envName -Name 'TF_WORKING_DIRECTORY' -Value $TfWorkingDirectory
}

Set-RepoVariable -Name 'CD_ROLLBACK_ON_SMOKE_FAILURE' -Value 'true'
Set-RepoVariable -Name 'CD_POST_DEPLOY_MAX_ATTEMPTS' -Value '6'
Set-RepoVariable -Name 'CD_POST_DEPLOY_RETRY_WAIT_SECONDS' -Value '10'
Set-RepoVariable -Name 'CD_CANARY_ENABLED' -Value 'true'
Set-RepoVariable -Name 'CD_CANARY_INITIAL_PERCENT' -Value '10'
Set-RepoVariable -Name 'CD_CANARY_BAKE_MINUTES' -Value '3'
Set-RepoVariable -Name 'SMOKE_SYNTHETIC_PATH' -Value '/api/auth/me'

Set-RepoSecretIfPresent -Name 'ALERT_SMS_PHONE_NUMBER' -Value $AlertSmsPhone
Set-RepoSecretIfPresent -Name 'ALERT_VOICE_PHONE_NUMBER' -Value $AlertVoicePhone

Write-Host 'Bootstrap complete. Verify environments under GitHub Settings → Environments.'

& (Join-Path $PSScriptRoot 'verify-cd-post-deploy-retry-vars.ps1')

if ($LASTEXITCODE -ne 0) {
    throw 'Post-deploy retry repository variable verification failed after bootstrap.'
}

& (Join-Path $PSScriptRoot 'verify-cd-canary-vars.ps1')

if ($LASTEXITCODE -ne 0) {
    throw 'CD canary repository variable verification failed after bootstrap.'
}

& (Join-Path $PSScriptRoot 'verify-cd-synthetic-path-vars.ps1')

if ($LASTEXITCODE -ne 0) {
    throw 'CD synthetic path repository variable verification failed after bootstrap.'
}
