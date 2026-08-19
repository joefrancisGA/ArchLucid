# Sets APPLICATIONINSIGHTS_CONNECTION_STRING on API/worker after terraform apply.
# AzAPI full-container PUT on brownfield apps fails ContainerAppSecretInvalid when secrets use Key Vault refs.
param(
    [string]$ResourceGroup = 'rg-ArchLucid-dev',
    [string]$ApiAppName = 'archlucid-api',
    [string]$WorkerAppName = 'archlucid-worker',
    [string]$ConnectionString = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
    Push-Location (Join-Path $PSScriptRoot '..\..\infra\terraform-monitoring')
    try {
        $ConnectionString = terraform output -raw application_insights_connection_string
    }
    finally {
        Pop-Location
    }
}

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
    throw 'Application Insights connection string is empty. Run terraform apply with enable_application_insights = true first.'
}

foreach ($app in @($ApiAppName, $WorkerAppName)) {
    az containerapp update `
        --resource-group $ResourceGroup `
        --name $app `
        --set-env-vars "APPLICATIONINSIGHTS_CONNECTION_STRING=$ConnectionString" | Out-Null
    Write-Host "Set APPLICATIONINSIGHTS_CONNECTION_STRING on $app"
}
