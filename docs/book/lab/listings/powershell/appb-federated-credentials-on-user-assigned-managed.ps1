$identities = Search-AzGraph -UseTenantScope -First 1000 -Query @'
resources
| where type =~ 'microsoft.managedidentity/userassignedidentities'
| project id, name, resourceGroup, subscriptionId, principalId = tostring(properties.principalId)
'@

$miFederated = foreach ($mi in $identities.Data) {
    Set-AzContext -Subscription $mi.subscriptionId | Out-Null
    Get-AzFederatedIdentityCredential -ResourceGroupName $mi.resourceGroup -IdentityName $mi.name |
        ForEach-Object {
            [pscustomobject]@{
                identityId  = $mi.id
                principalId = $mi.principalId
                issuer      = $_.Issuer
                subject     = $_.Subject
            }
        }
}
