targetScope = 'subscription'

@description('ArchLucid Entra tenant id used as the federated credential issuer.')
param archLucidTenantId string

@description('Object id of ArchLucid user-assigned managed identity (federated subject).')
param archLucidManagedIdentityObjectId string

@description('Customer subscription id scoped for Reader + Cost Management Reader.')
param subscriptionId string

@description('Azure region metadata for deployment.')
param location string = 'eastus'

var readerRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606da81c167')
var costManagementReaderRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2a007257-a71a-4a10-8aee-4ce74cb1d364')

resource extractorApp 'Microsoft.Graph/applications@v1.0' = {
  uniqueName: 'archlucid-readonly-extractor-${uniqueString(subscriptionId)}'
  displayName: 'archlucid-readonly-extractor'
}

resource extractorSp 'Microsoft.Graph/servicePrincipals@v1.0' = {
  appId: extractorApp.appId
}

resource federatedCredential 'Microsoft.Graph/applications/federatedIdentityCredentials@v1.0' = {
  parent: extractorApp
  name: 'archlucid-tier2-extractor'
  properties: {
    audiences: [
      'api://AzureADTokenExchange'
    ]
    issuer: 'https://login.microsoftonline.com/${archLucidTenantId}/v2.0'
    subject: archLucidManagedIdentityObjectId
  }
}

resource readerAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscriptionId, extractorSp.id, 'Reader')
  scope: subscription(subscriptionId)
  properties: {
    roleDefinitionId: readerRoleDefinitionId
    principalId: extractorSp.id
    principalType: 'ServicePrincipal'
  }
}

resource costReaderAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscriptionId, extractorSp.id, 'CostManagementReader')
  scope: subscription(subscriptionId)
  properties: {
    roleDefinitionId: costManagementReaderRoleDefinitionId
    principalId: extractorSp.id
    principalType: 'ServicePrincipal'
  }
}

output customerTenantId string = tenant().tenantId
output customerAppId string = extractorApp.appId
output subscriptionId string = subscriptionId
