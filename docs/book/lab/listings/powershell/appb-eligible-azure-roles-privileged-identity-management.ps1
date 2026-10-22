Get-AzRoleEligibilityScheduleInstance -Scope "/subscriptions/$subscriptionId" |
    Select-Object PrincipalId, PrincipalType, RoleDefinitionId, Scope, EndDateTime
