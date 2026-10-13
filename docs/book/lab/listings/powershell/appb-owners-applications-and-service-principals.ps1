$spProperties = 'id,appId,displayName,servicePrincipalType'
$servicePrincipals = Get-MgServicePrincipal -All -Property $spProperties

$spOwners = foreach ($sp in $servicePrincipals) {
    Get-MgServicePrincipalOwner -ServicePrincipalId $sp.Id -All |
        ForEach-Object {
            [pscustomobject]@{ spObjectId = $sp.Id; appId = $sp.AppId; ownerId = $_.Id }
        }
}
