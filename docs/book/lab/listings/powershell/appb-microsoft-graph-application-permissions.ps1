$graphSp = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
$graphRoles = @{}
$graphSp.AppRoles | ForEach-Object { $graphRoles[$_.Id.ToString()] = $_.Value }

$graphGrants = foreach ($sp in $servicePrincipals) {
    Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -All |
        Where-Object { $_.ResourceId -eq $graphSp.Id } |
        ForEach-Object {
            [pscustomobject]@{
                principalId = $sp.Id
                appId       = $sp.AppId
                permission  = $graphRoles[$_.AppRoleId.ToString()]
            }
        }
}
