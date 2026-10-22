@description('Customer Entra tenant id where the extractor service principal is created.')
param customerTenantId string

@description('ArchLucid SaaS Entra tenant id (WIF issuer tenant).')
param archLucidTenantId string

@description('Object id of ArchLucid user-assigned managed identity (WIF subject).')
param archLucidManagedIdentityObjectId string

@description('Customer subscription id for Reader + Cost Management Reader assignments.')
param subscriptionId string

var forbiddenRoles = [
  'Owner'
  'Contributor'
  'User Access Administrator'
  'Global Reader'
]

var allowedRoles = [
  'Reader'
  'Cost Management Reader'
]

resource extractorApp 'Microsoft.Graph/applications@v1.0' = {
  uniqueName: 'archlucid-readonly-extractor'
  displayName: 'archlucid-readonly-extractor'
}

resource extractorSp 'Microsoft.Graph/servicePrincipals@v1.0' = {
  appId: extractorApp.appId
}

resource federatedCredential 'Microsoft.Graph/applications/federatedIdentityCredentials@v1.0' = {
  parentId: extractorApp.id
  name: 'archlucid-hosted-extractor-wif'
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
  scope: subscriptionId
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7')
    principalId: extractorSp.id
    principalType: 'ServicePrincipal'
  }
}

resource costReaderAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscriptionId, extractorSp.id, 'CostManagementReader')
  scope: subscriptionId
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '72fafed1-73ab-47ab-bb83-1525d772d776')
    principalId: extractorSp.id
    principalType: 'ServicePrincipal'
  }
}

@description('Paste into ArchLucid hosted extractor configure UI.')
output customerAppId string = extractorApp.appId

output customerTenantIdOut string = customerTenantId

output subscriptionIdOut string = subscriptionId

output allowedRoleNames array = allowedRoles

output forbiddenRoleNames array = forbiddenRoles
