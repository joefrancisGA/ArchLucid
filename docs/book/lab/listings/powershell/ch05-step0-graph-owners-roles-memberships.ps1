$owners = foreach ($app in $applications) {
    Get-MgApplicationOwner -ApplicationId $app.Id -All |
        ForEach-Object {
            [pscustomobject]@{
                appObjectId = $app.Id
                appId       = $app.AppId
                ownerId     = $_.Id
            }
        }
}

$roleDefinitions = Get-MgRoleManagementDirectoryRoleDefinition -All
$directoryRoles = Get-MgRoleManagementDirectoryRoleAssignment -All |
    ForEach-Object {
        $definitionId = $_.RoleDefinitionId
        $principal = Get-MgDirectoryObject -DirectoryObjectId $_.PrincipalId
        [pscustomobject]@{
            principalId      = $_.PrincipalId
            principalType    = $principal.AdditionalProperties['@odata.type']
            roleDefinitionId = $definitionId
            directoryScopeId = $_.DirectoryScopeId
            roleName         = ($roleDefinitions | Where-Object Id -eq $definitionId).DisplayName
        }
    }

$roleAssignments = Get-Content (Join-Path $snapshotDir 'role-assignments.json') -Raw |
    ConvertFrom-Json
$azureRoleGroupIds = $roleAssignments |
    Where-Object { $_.principalType -eq 'Group' } |
    Select-Object -ExpandProperty principalId -Unique
$directoryRoleGroupIds = $directoryRoles |
    Where-Object { $_.principalType -eq '#microsoft.graph.group' } |
    Select-Object -ExpandProperty principalId -Unique
$assignedGroupIds = @($azureRoleGroupIds + $directoryRoleGroupIds) | Select-Object -Unique

$memberships = foreach ($groupId in $assignedGroupIds) {
    # transitiveMembers includes nested groups; direct members would hide them.
    Get-MgGroupTransitiveMember -GroupId $groupId -All |
        ForEach-Object {
            [pscustomobject]@{
                groupId  = $groupId
                memberId = $_.Id
            }
        }
}
