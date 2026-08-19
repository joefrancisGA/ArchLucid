#Requires -Version 5.1
<#
.SYNOPSIS
  Binds Authentication:ApiKey tenant/workspace/project claim GUIDs on an API Container App (TB-304).

.DESCRIPTION
  Production-like API hosts reject requests when ApiKey auth only binds TenantId (or none).
  This sets all three claim env vars. Defaults match ArchLucid.Core.Scoping.ScopeIds /
  archlucid-ui getScopeHeaders().

  Note: infra/terraform-container-apps ignores container env on apply for brownfield apps;
  use this script (or terraform api_key_*_id on greenfield) so claims stick.

.PARAMETER ResourceGroup
  Azure resource group (default rg-ArchLucid-dev).

.PARAMETER ContainerApp
  API Container App name (default archlucid-api).

.PARAMETER TenantId
  Authentication__ApiKey__TenantId (default ScopeIds.DefaultTenant).

.PARAMETER WorkspaceId
  Authentication__ApiKey__WorkspaceId (default ScopeIds.DefaultWorkspace).

.PARAMETER ProjectId
  Authentication__ApiKey__ProjectId (default ScopeIds.DefaultProject).
#>
[CmdletBinding()]
param(
    [string] $ResourceGroup = 'rg-ArchLucid-dev',
    [string] $ContainerApp = 'archlucid-api',
    [string] $TenantId = '11111111-1111-1111-1111-111111111111',
    [string] $WorkspaceId = '22222222-2222-2222-2222-222222222222',
    [string] $ProjectId = '33333333-3333-3333-3333-333333333333'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

foreach ($name in @('TenantId', 'WorkspaceId', 'ProjectId')) {
    $value = Get-Variable -Name $name -ValueOnly

    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "$name must be a non-empty GUID string."
    }
}

Write-Host "Updating $ContainerApp in $ResourceGroup with ApiKey scope claims..."
az containerapp update `
    -g $ResourceGroup `
    -n $ContainerApp `
    --set-env-vars `
    "Authentication__ApiKey__TenantId=$TenantId" `
    "Authentication__ApiKey__WorkspaceId=$WorkspaceId" `
    "Authentication__ApiKey__ProjectId=$ProjectId" `
    --output none

if ($LASTEXITCODE -ne 0) {
    throw "az containerapp update failed with exit $LASTEXITCODE"
}

Write-Host "Done. Confirm with: az containerapp show -g $ResourceGroup -n $ContainerApp --query `"properties.template.containers[0].env[?contains(name,'ApiKey')]`""
