$subscriptions = Get-Content (Join-Path $snapshotDir 'subscriptions.json') -Raw | ConvertFrom-Json

$denyAssignments = foreach ($subscription in $subscriptions) {
    # Deny assignments aren't a documented Resource Graph type, so read them from the REST API.
    $path = "/subscriptions/$($subscription.subscriptionId)" +
        '/providers/Microsoft.Authorization/denyAssignments?api-version=2022-04-01'

    while ($path) {
        $page = (Invoke-AzRestMethod -Method GET -Path $path).Content | ConvertFrom-Json

        foreach ($deny in $page.value) {
            # One row per permission block, so a block's own condition stays with it.
            foreach ($permission in $deny.properties.permissions) {
                [pscustomobject]@{
                    id                      = $deny.id
                    scope                   = $deny.properties.scope
                    doNotApplyToChildScopes = [bool] $deny.properties.doNotApplyToChildScopes
                    principals              = $deny.properties.principals
                    excludePrincipals       = $deny.properties.excludePrincipals
                    condition               = $deny.properties.condition
                    actions                 = $permission.actions
                    notActions              = $permission.notActions
                    dataActions             = $permission.dataActions
                    notDataActions          = $permission.notDataActions
                    permissionCondition     = $permission.condition
                }
            }
        }

        # nextLink is a full URL; Invoke-AzRestMethod -Path takes the part after the host.
        $path = if ($page.nextLink) { ([uri] $page.nextLink).PathAndQuery } else { $null }
    }
}
