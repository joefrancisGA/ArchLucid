Get-MgRoleManagementDirectoryRoleEligibilitySchedule -All |
    Select-Object PrincipalId, RoleDefinitionId, DirectoryScopeId, MemberType
