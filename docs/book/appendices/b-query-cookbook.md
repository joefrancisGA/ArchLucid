> **Scope:** Appendix B first draft for the book draft *Managing Azure Security with AI*: a cookbook of read-only Azure Resource Graph, Microsoft Graph, Azure Resource Manager, and Log Analytics queries that collect the evidence the chapters use. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Appendix B — Query cookbook

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md) · **Lab:** [Appendix A](a-companion-lab.md) · **Query files:** [`../lab/queries`](../lab/queries)

> *Draft status: first draft. Queries taken from Chapters 3–8 and 12 match the chapter text. The recipes new in this appendix were written against current documentation in October 2026 and have not yet been run against a live tenant; the author notes list which are which.*

This appendix collects the queries the book uses, plus the ones the chapters describe without printing, in one place. Each recipe says which chapter needs it, which snapshot file it feeds, and the trap that most often makes it wrong.

Every recipe here is **read-only**. With one exception called out in B.6, the collector identity from Chapter 3 can run them all: Reader at the scope you collect, plus the four Microsoft Graph application permissions (`Application.Read.All`, `GroupMember.Read.All`, `User.Read.All`, `RoleManagement.Read.Directory`) [S1]. Where a recipe needs more, it says so, and the missing permission is a gap to record, not a reason to widen the collector quietly.

Hop labels (H1–H9) and path labels (P1–P6) are the IDs from Chapter 9's evidence pack (section 9.3).

---

## B.1 Rules that apply to every recipe

Chapter 3 found four traps that models and people both fall into. They apply to every query below, so they're stated once here.

1. **Absent isn't false.** Many security properties are missing until someone sets them, and missing usually means the platform default, which is often the permissive one. Keep "not set" as its own value, then let the derivation apply the documented default and say so.
2. **Join role definitions on the GUID.** The same built-in role appears under different full IDs depending on the scope that references it [S2]. The trailing GUID is stable [S2].
3. **Read every page.** Resource Graph returns up to 1,000 rows per call [S3], and Microsoft Graph pages too [S4]. A collector that reads one page loses data without an error.
4. **Applications aren't service principals.** Federated credentials and app owners attach to the application object [S5]; Azure role assignments point at the service principal [S6]. Join them through `appId`.

Two more come from the later chapters:

5. **A failed query is a gap, never an empty result.** Throttling, a 403, or an unreadable subscription must land in the manifest's gap list (Chapter 3, section 3.7). An empty file means "we looked and found nothing", and you must only write one when that's true.
6. **Test against a known answer.** Before a new query goes into the collector, run it against the lab, where Appendix A says what it should return. A query that finds the six paths' inputs in the lab has earned a place; one that has only been reviewed hasn't.
7. **Time every file.** Record when each query started and finished, and with which API, client version, and scope (Chapter 3, section 3.5). `Invoke-ArgQuery` does it through `Save-SnapshotFile`. Without per-file times, nothing downstream can tell a path joined from reads an hour apart from one read in a minute.

### Running Resource Graph queries

Use Chapter 3's `Invoke-ArgQuery` (section 3.10, Step 1). It pages with the skip token [S7, S3], runs at tenant scope with `-UseTenantScope` [S7], and turns any failure into a `partialResult` gap. Every Resource Graph recipe below is written to be saved as a `.kql` file and passed to it:

<!-- listing: lab/listings/powershell/appb-running-resource-graph-queries.ps1 -->

```powershell
Invoke-ArgQuery -Name 'nsg-rules' -Query (Get-Content queries/nsg-rules.kql -Raw)
```

Resource Graph only returns rows from subscriptions the caller can read, silently [S8]. Section B.2's scope recipe is what turns that silence into a recorded gap.

### Running Microsoft Graph calls

Use the Microsoft Graph PowerShell SDK, connected with `Connect-MgGraph -Identity` [S9], and pass `-All` to every `Get-Mg…` list call so the SDK follows the paging links [S4]. Ask for the properties you need with `-Property` [S10]. Graph omits many properties by default, and an omitted property looks exactly like an empty one.

### Running Azure Resource Manager calls

Some evidence isn't in Resource Graph at all: diagnostic settings, App Service access restrictions, SQL firewall rules, and firewall policy rule collections [S11]. For those, call Azure Resource Manager (ARM) directly. The Az cmdlets named below do that, and `Invoke-AzRestMethod -Method GET` works for anything without a cmdlet. Wrap each call in the same try/catch pattern as `Invoke-ArgQuery`, so a 403 becomes an `apiNotPermitted` gap.

---

## B.2 Scope: what the collector can and should see

**Chapters:** 3, 10. **Snapshot files:** `subscriptions.json`, `scope-parents.json`, `expected-subscriptions.json`.

The subscriptions the collector can read (Chapter 3, section 3.3):

<!-- listing: lab/queries/subscriptions.kql -->

```kusto
resourcecontainers
| where type =~ 'microsoft.resources/subscriptions'
| project subscriptionId, name, properties.state
```

The scope hierarchy, so role assignments at a management group or resource group can be inherited down to the resources beneath them (Chapter 5, Step 0):

<!-- listing: lab/listings/kql/appb-management-group-hierarchy.kql -->

```kusto
resourcecontainers
| extend parentId = case(
    type =~ 'microsoft.resources/subscriptions/resourcegroups',
        strcat('/subscriptions/', subscriptionId),
    type =~ 'microsoft.management/managementgroups',
        tostring(properties.details.parent.id),
    '')
| project id, name, type, parentId
```

**Trap.** Neither query tells you which subscriptions *exist*. That needs a source with wider visibility: the management group hierarchy read from the root (`Get-AzManagementGroup -GroupName <root id> -Expand -Recurse`), a list from the platform team, or billing records. If the collector can't read the root, the expected list is a human assertion. Record who gave it and when, and compare it on every run.

---

## B.3 Authorization: Azure RBAC

**Chapters:** 2, 3, 4, 9, 10. **Snapshot files:** `role-assignments.json`, `role-definitions.json`, `deny-assignments.json`, `role-eligibility.json`.

Role assignments and role definitions come from the `authorizationresources` table [S12].

### Role assignments with role names

From Chapter 3, section 3.3. It's the query behind hops H5 and H9.

<!-- listing: lab/queries/role-assignments.kql -->

```kusto
authorizationresources
| where type =~ 'microsoft.authorization/roleassignments'
| extend
    principalId = tostring(properties.principalId),
    principalType = tostring(properties.principalType),
    scope = tostring(properties.scope),
    roleDefinitionGuid = tostring(split(tostring(properties.roleDefinitionId), '/')[-1]),
    condition = tostring(properties.condition)
| join kind=leftouter (
    authorizationresources
    | where type =~ 'microsoft.authorization/roledefinitions'
    | extend roleDefinitionGuid = tostring(split(id, '/')[-1]),
             roleName = tostring(properties.roleName)
    | project roleDefinitionGuid, roleName
    | distinct roleDefinitionGuid, roleName
) on roleDefinitionGuid
| project id, principalId, principalType, roleName, scope, condition
```

**Trap.** Keep `condition`, even though it's usually empty. A condition can narrow what the role allows [S13], and Chapter 2 listed "no role condition" as a checked assumption.

### Role definitions with their actions

From Chapter 5, Step 0. Paths come from actions, not role names, so this is what turns "Contributor" into "can list storage keys".

<!-- listing: lab/listings/kql/appb-role-definitions-with-their-actions.kql -->

```kusto
authorizationresources
| where type =~ 'microsoft.authorization/roledefinitions'
| mv-expand permission = properties.permissions
| project
    id,
    roleName = tostring(properties.roleName),
    actions = permission.actions,
    notActions = permission.notActions,
    dataActions = permission.dataActions,
    notDataActions = permission.notDataActions
```

**Trap.** `actions` and `dataActions` are separate [S2]. Control-plane `*` doesn't grant data-plane reads, which is why Contributor needs list keys (H7) to read blobs while a data role reads them directly.

### Deny assignments

From Chapter 5, Step 0. A deny assignment can remove an edge that a role assignment created [S14].

Deny assignments aren't a documented type in Resource Graph's `authorizationresources` table [S11], so this recipe reads them from the Authorization REST API, one subscription at a time, following `nextLink` [S14]. With no filter, the list returns deny assignments at, above, and below the subscription, so assignments on resource groups and resources come back too [S15]. The caller needs `Microsoft.Authorization/denyAssignments/read` [S14]. The recipe writes one row per permission block, the shape Chapter 5's loader expects. Save the rows with `Save-SnapshotFile` as `deny-assignments`.

<!-- listing: lab/listings/powershell/appb-deny-assignments.ps1 -->

```powershell
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
```

**Trap.** Keep `excludePrincipals`, `condition`, and `permissionCondition` [S14]. An excluded principal escapes the deny. A deny with a condition might not apply, so Chapter 5's derivation labels the hop as an unmodeled control instead of treating it as blocked.

### Eligible Azure roles (Privileged Identity Management)

Chapter 4's Rule 5 says eligible isn't active, and Chapter 13 asks the search to report eligible paths separately. Eligibility isn't in the role assignment rows. Read it through ARM at each scope you collect:

<!-- listing: lab/listings/powershell/appb-eligible-azure-roles-privileged-identity-management.ps1 -->

```powershell
Get-AzRoleEligibilityScheduleInstance -Scope "/subscriptions/$subscriptionId" |
    Select-Object PrincipalId, PrincipalType, RoleDefinitionId, Scope, EndDateTime
```

**Trap.** PIM has *schedules*, which describe a grant as requested, and *instances* (`roleEligibilityScheduleInstances`), which describe what's in effect [S16]. Collect instances, and keep `EndDateTime` so an analyst can see when an eligibility lapses.

---

## B.4 Authorization: Entra ID

**Chapters:** 2, 4, 9, 10. **Snapshot files:** `federated-credentials.json`, `service-principals.json`, `application-owners.json`, `service-principal-owners.json`, `directory-role-assignments.json`, `directory-role-eligibility.json`, `transitive-memberships.json`, `graph-app-role-assignments.json`, `managed-identity-federated-credentials.json`.

### Federated credentials on applications

Chapter 3, section 3.4, prints the loop. It reads every application with `Get-MgApplication -All -Property 'id,appId,displayName'`, then `Get-MgApplicationFederatedIdentityCredential` for each, and keeps `appId`, `issuer`, `subject`, and `audiences`. It's hop H1.

**Trap.** Record the subject exactly as stored. GitHub now issues two subject formats [S17], and the broad patterns Chapter 4 warns about are a property of the string.

### Federated credentials on user-assigned managed identities

Managed identities can trust external tokens too, and Chapter 3's loop doesn't see them, because they live in Azure rather than in the application list. A federated credential on `mi-payments-api` would be an entry point straight to `custdata`. Collect them per identity:

<!-- listing: lab/listings/powershell/appb-federated-credentials-on-user-assigned-managed.ps1 -->

```powershell
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
```

Page the identity query with `Invoke-ArgQuery` in a real collector. The short form above is for the lab, where there are three identities.

**Trap.** Who can *add* one of these matters as much as who has one. Writing a federated credential is an ARM action on the identity (`…/federatedIdentityCredentials/write`) [S18], so Contributor at the identity's resource group can do it [S18]. That's why Appendix A keeps `mi-payments-api` out of `rg-payments-prod`.

### Owners: applications and service principals

Application owners can add credentials to the application (hop H2). Chapter 5, Step 0, prints the loop, using `Get-MgApplicationOwner -ApplicationId $app.Id -All`.

Service principals have owners of their own, separate from the application's, and an owner of a service principal can manage it too. Collect them the same way:

<!-- listing: lab/listings/powershell/appb-owners-applications-and-service-principals.ps1 -->

```powershell
$spProperties = 'id,appId,displayName,servicePrincipalType'
$servicePrincipals = Get-MgServicePrincipal -All -Property $spProperties

$spOwners = foreach ($sp in $servicePrincipals) {
    Get-MgServicePrincipalOwner -ServicePrincipalId $sp.Id -All |
        ForEach-Object {
            [pscustomobject]@{ spObjectId = $sp.Id; appId = $sp.AppId; ownerId = $_.Id }
        }
}
```

**Trap.** In a large tenant, one call per object is slow. Get it right first, then batch. A fast collector that skips owners hides H2 entirely.

### Directory role assignments and eligibility

Chapter 5, Step 0, prints the assignment loop: `Get-MgRoleManagementDirectoryRoleAssignment -All`, joined to `Get-MgRoleManagementDirectoryRoleDefinition -All` for names, keeping `directoryScopeId`. It's hop H3.

Eligible directory roles come from a different call, under the same permission:

<!-- listing: lab/listings/powershell/appb-directory-role-assignments-and-eligibility.ps1 -->

```powershell
Get-MgRoleManagementDirectoryRoleEligibilitySchedule -All |
    Select-Object PrincipalId, RoleDefinitionId, DirectoryScopeId, MemberType
```

**Trap.** Keep `directoryScopeId`. Cloud Application Administrator at `/` fans out to every application; the same role scoped to an administrative unit doesn't. That one column is the difference between H3 and no path.

### Transitive group membership

Chapter 5, Step 0: `Get-MgGroupTransitiveMember -GroupId $groupId -All` for every group that holds an Azure role or a directory role [S19]. Use the transitive call. Direct members hide nested groups.

### Microsoft Graph application permissions

A service principal with a powerful Graph application permission, such as `RoleManagement.ReadWrite.Directory` or `Application.ReadWrite.All`, can create paths of its own. List what each service principal holds against Microsoft Graph (service principal object ID `00000003-0000-0000-c000-000000000000`) [S1]:

<!-- listing: lab/listings/powershell/appb-microsoft-graph-application-permissions.ps1 -->

```powershell
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
```

The collector's own four permissions should appear in the output. That's a cheap self-check, and Chapter 13's governance review can use it.

### Guests

<!-- listing: lab/listings/powershell/appb-guests.ps1 -->

```powershell
Get-MgUser -All -Filter "userType eq 'Guest'" `
    -Property 'id,displayName,mail,externalUserState,createdDateTime'
```

`externalUserState` of `PendingAcceptance` is Appendix A's never-redeemed guest. Last sign-in time is in `signInActivity`, which needs `AuditLog.Read.All` [S20, S1]. The Chapter 3 collector doesn't hold it, so "no recent sign-in" is a gap unless you grant that permission deliberately.

---

## B.5 Resources and data stores

**Chapters:** 1, 2, 3, 5, 9, 10. **Snapshot files:** `storage-accounts.json`, `compute-identities.json`, `local-auth.json`, `key-vaults.json`.

### Storage accounts: shared key and exposure

Chapter 3's query, with its shared key handling, and the network fields Chapter 6's `storage_public_exposure` reads. It's hops H6 and H7, and the input to the Chapter 1 checklist.

<!-- listing: lab/listings/kql/appb-storage-accounts-shared-key-and-exposure.kql -->

```kusto
resources
| where type =~ 'microsoft.storage/storageaccounts'
| extend sharedKey = case(
    isnull(properties.allowSharedKeyAccess), 'not set (platform default)',
    tobool(properties.allowSharedKeyAccess), 'enabled',
    'disabled')
| project
    id, name, subscriptionId, resourceGroup, tags,
    sharedKey,
    publicNetworkAccess = tostring(properties.publicNetworkAccess),
    defaultAction = tostring(properties.networkAcls.defaultAction),
    bypass = tostring(properties.networkAcls.bypass),
    ipRules = properties.networkAcls.ipRules,
    virtualNetworkRules = properties.networkAcls.virtualNetworkRules,
    allowBlobPublicAccess = properties.allowBlobPublicAccess,
    privateEndpoints = array_length(properties.privateEndpointConnections)
```

**Trap.** Keep `publicNetworkAccess` empty when it's empty. Chapter 6 explains why an unset value is not "Disabled". When `allowSharedKeyAccess` is absent, the platform default allows shared key access [S21].

### Local authentication on other services

Shared key is storage's name for a pattern that recurs: a key or connection string that works without an identity, and destroys attribution (Chapter 8). Other services expose it as `disableLocalAuth`, where absent usually means local authentication is **allowed** [S22]:

<!-- listing: lab/listings/kql/appb-local-authentication-on-other-services.kql -->

```kusto
resources
| where type in~ (
    'microsoft.documentdb/databaseaccounts',
    'microsoft.servicebus/namespaces',
    'microsoft.eventhub/namespaces',
    'microsoft.cognitiveservices/accounts')
| extend localAuth = case(
    isnull(properties.disableLocalAuth), 'not set (platform default)',
    tobool(properties.disableLocalAuth), 'disabled',
    'enabled')
| project id, type, name, resourceGroup, subscriptionId, localAuth
```

**Trap.** The property name is negative. `disableLocalAuth = false` means keys work. Write the case so the output says "enabled" or "disabled" about the keys, not about the flag, and the reader can't misread it.

### Key vaults

<!-- listing: lab/listings/kql/appb-key-vaults.kql -->

```kusto
resources
| where type =~ 'microsoft.keyvault/vaults'
| project
    id, name, resourceGroup, subscriptionId,
    rbacAuthorization = tobool(properties.enableRbacAuthorization),
    accessPolicies = properties.accessPolicies,
    publicNetworkAccess = tostring(properties.publicNetworkAccess),
    defaultAction = tostring(properties.networkAcls.defaultAction),
    purgeProtection = properties.enablePurgeProtection
```

**Trap.** A vault that uses access policies instead of Azure RBAC grants data access *outside* role assignments [S23]. Its `accessPolicies` entries are edges your role-assignment query never sees. Treat each object ID in them as holding the listed secret, key, and certificate permissions on that vault.

### Compute identities

From Chapter 5, Step 0. It links each workload to the identities it runs as (hop H8):

<!-- listing: lab/listings/kql/appb-compute-identities.kql -->

```kusto
resources
| where isnotempty(identity)
| project
    id,
    name,
    type,
    kind,
    parentScope = strcat('/subscriptions/', subscriptionId, '/resourceGroups/', resourceGroup),
    identityType = tostring(identity.type),
    systemAssignedPrincipalId = tostring(identity.principalId),
    userAssignedIdentities = identity.userAssignedIdentities
```

**Trap.** `userAssignedIdentities` is a map from identity resource ID to `{clientId, principalId}`. Keep the map. The principal ID is what joins to role assignments, and the client ID is what an app setting like `AZURE_CLIENT_ID` names.

### Resources with a private endpoint and an open public endpoint

From Chapter 6, section 6.3. It's the first step of that chapter's lab:

<!-- listing: lab/listings/kql/appb-resources-with-a-private-endpoint-and.kql -->

```kusto
resources
| where isnotnull(properties.privateEndpointConnections)
| where array_length(properties.privateEndpointConnections) > 0
| extend publicNetworkAccess = tostring(properties.publicNetworkAccess)
| where publicNetworkAccess !~ 'Disabled'
| project id, type, name, resourceGroup, subscriptionId,
    publicNetworkAccess = iff(isempty(publicNetworkAccess), '(unset)', publicNetworkAccess),
    defaultAction = tostring(properties.networkAcls.defaultAction),
    privateEndpoints = array_length(properties.privateEndpointConnections)
```

Use it to find candidates, then classify each type with its own logic.

---

## B.6 Declared flows: app configuration

**Chapters:** 6, 9. **Snapshot file:** `app-config.json`.

Chapter 8's declared flows come from configuration: which store an app is configured to talk to, and as which identity. This is the one place where Reader isn't enough, and where the read-only rule and the never-collect-secrets rule (Chapter 3, section 3.6) collide.

**Site configuration** is readable with Reader. It holds the inbound access restrictions Chapter 6 needs, including whether the advanced tools (SCM) site follows the main site's rules:

<!-- listing: lab/listings/powershell/appb-declared-flows-app-configuration.ps1 -->

```powershell
$response = Invoke-AzRestMethod -Method GET -Path "$($site.id)/config/web?api-version=2023-12-01"
$web = ($response.Content | ConvertFrom-Json).properties

[pscustomobject]@{
    siteId                           = $site.id
    publicNetworkAccess              = $web.publicNetworkAccess
    ipSecurityRestrictions           = $web.ipSecurityRestrictions
    scmIpSecurityRestrictions        = $web.scmIpSecurityRestrictions
    scmIpSecurityRestrictionsUseMain = $web.scmIpSecurityRestrictionsUseMain
}
```

**App settings aren't.** Reading them is a separate `list` action (`Microsoft.Web/sites/config/list/action`) that Reader doesn't include [S24], and it returns every value, secrets included. You can't get the names without the values. You have three options, in order of preference:

1. **Read declared flows from infrastructure as code.** The Terraform that created the app names the setting and the store, and reading a repository needs no Azure permission at all. Appendix A's `ARCHIVE_ACCOUNT` and `CUSTOMER_ACCOUNT` settings are in `payments.tf`.
2. **Rely on the declared flows Reader can see.** Chapter 8 counts a data-plane role held by a workload identity as a declared flow, and B.3 and B.5 already collect both halves: the role assignment, and which workload runs as that identity. Private endpoints and integration configuration add more. What you lose is any app that reaches a store with a key or connection string instead of an identity. Those leave no role assignment behind, and they're the flows Chapter 8 most wants you to find, which is why option 1 comes first.
3. **Grant the list action to a separate, narrowly scoped identity** that strips values before anything is written, keeping only setting names and values that name a resource. That identity can read secrets, so it belongs in Chapter 13's governance review, not in the everyday collector.

Whichever you use, record which in the manifest, so a reader knows whether the app setting evidence came from code, from live settings, or wasn't collected.

---

## B.7 Network reachability

**Chapter:** 5. **Snapshot files:** `nsg-rules.json`, `vnets.json`, `route-tables.json`, `private-endpoints.json`, `private-dns-links.json`, `public-ips.json`, `firewall-rules.json`, `service-tags.json`, `sql-firewall-rules.json`.

Chapter 7, section 7.1, lists what reachability needs. These are the queries behind that list.

### NSG rules

<!-- listing: lab/listings/kql/appb-nsg-rules.kql -->

```kusto
resources
| where type =~ 'microsoft.network/networksecuritygroups'
| mv-expand rule = array_concat(properties.securityRules, properties.defaultSecurityRules)
| project
    nsgId = id,
    nsgName = name,
    subnets = properties.subnets,
    networkInterfaces = properties.networkInterfaces,
    ruleName = tostring(rule.name),
    isDefault = tostring(rule.id) contains '/defaultSecurityRules/',
    direction = tostring(rule.properties.direction),
    access = tostring(rule.properties.access),
    priority = toint(rule.properties.priority),
    protocol = tostring(rule.properties.protocol),
    sourcePrefix = tostring(rule.properties.sourceAddressPrefix),
    sourcePrefixes = rule.properties.sourceAddressPrefixes,
    destinationPortRange = tostring(rule.properties.destinationPortRange),
    destinationPortRanges = rule.properties.destinationPortRanges
```

**Trap.** Each rule has a singular field and a plural one for addresses and ports, and only one is filled. Appendix A's checklist query reads only `destinationPortRange`, which is fine for its single-port lab rule and not enough in general: a rule allowing `3389` inside `destinationPortRanges`, or a range like `3000-4000`, slips past it. Keep both fields and evaluate ranges in code, as Chapter 6's `evaluate_inbound` does.

Keep the default rules too. `AllowVnetInBound` is why "no custom rule" doesn't mean "no traffic" [S25].

### Virtual networks, subnets, and peerings

<!-- listing: lab/listings/kql/appb-virtual-networks-subnets-and-peerings.kql -->

```kusto
resources
| where type =~ 'microsoft.network/virtualnetworks'
| project
    id, name, resourceGroup, subscriptionId,
    addressPrefixes = properties.addressSpace.addressPrefixes,
    subnets = properties.subnets,
    peerings = properties.virtualNetworkPeerings
```

Each subnet entry carries `networkSecurityGroup.id`, `routeTable.id`, `serviceEndpoints`, `delegations`, and `privateEndpointNetworkPolicies`. Each peering carries `remoteVirtualNetwork.id`, `peeringState`, `allowForwardedTraffic`, `allowGatewayTransit`, and `useRemoteGateways`.

**Trap.** Peering isn't transitive [S26]. Spoke A peered to the hub and spoke B peered to the hub can't talk unless a route sends their traffic through something in the hub that forwards it. That's why the route tables matter.

### Route tables

<!-- listing: lab/listings/kql/appb-route-tables.kql -->

```kusto
resources
| where type =~ 'microsoft.network/routetables'
| mv-expand route = properties.routes
| project
    id, name,
    subnets = properties.subnets,
    disableBgpRoutePropagation = tobool(properties.disableBgpRoutePropagation),
    addressPrefix = tostring(route.properties.addressPrefix),
    nextHopType = tostring(route.properties.nextHopType),
    nextHopIpAddress = tostring(route.properties.nextHopIpAddress)
```

### Private endpoints and private DNS

<!-- listing: lab/listings/kql/appb-private-endpoints-and-private-dns.kql -->

```kusto
resources
| where type =~ 'microsoft.network/privateendpoints'
| mv-expand connection = array_concat(
    properties.privateLinkServiceConnections,
    properties.manualPrivateLinkServiceConnections)
| project
    id, name,
    subnetId = tostring(properties.subnet.id),
    targetId = tostring(connection.properties.privateLinkServiceId),
    groupIds = connection.properties.groupIds,
    status = tostring(connection.properties.privateLinkServiceConnectionState.status)
```

<!-- listing: lab/listings/kql/appb-private-endpoints-and-private-dns-2.kql -->

```kusto
resources
| where type =~ 'microsoft.network/privatednszones/virtualnetworklinks'
| project
    id,
    zone = tostring(split(id, '/')[8]),
    virtualNetworkId = tostring(properties.virtualNetwork.id),
    registrationEnabled = tobool(properties.registrationEnabled)
```

**Trap.** A private endpoint only helps a client whose DNS resolves the service name to the private address. That depends on which virtual networks the zone is linked to, which is Chapter 7 Step 5's surprise: the lab's zone is linked to the payments spoke only, so the dev spoke resolves `custdata` to its public address.

### Public IP addresses

<!-- listing: lab/listings/kql/appb-public-ip-addresses.kql -->

```kusto
resources
| where type =~ 'microsoft.network/publicipaddresses'
| project
    id, name,
    ipAddress = tostring(properties.ipAddress),
    attachedTo = tostring(properties.ipConfiguration.id)
```

`attachedTo` is the IP configuration of a network interface, load balancer, gateway, or firewall. Trim it to the parent resource ID to join.

### Firewall policy rules

Rule collection groups are child resources of a firewall policy. Read them through ARM:

<!-- listing: lab/listings/powershell/appb-firewall-policy-rules.ps1 -->

```powershell
$policy = Get-AzFirewallPolicy -ResourceGroupName 'rg-network' -Name 'afwp-hub'

$firewallRules = foreach ($groupRef in $policy.RuleCollectionGroups) {
    $groupName = ($groupRef.Id -split '/')[-1]
    $group = Get-AzFirewallPolicyRuleCollectionGroup -Name $groupName `
        -ResourceGroupName $policy.ResourceGroupName -AzureFirewallPolicyName $policy.Name

    foreach ($collection in $group.Properties.RuleCollection) {
        foreach ($rule in $collection.Rules) {
            [pscustomobject]@{
                policyId             = $policy.Id
                group                = $groupName
                collection           = $collection.Name
                action               = $collection.Action.Type
                rule                 = $rule.Name
                ruleType             = $rule.RuleType
                sourceAddresses      = $rule.SourceAddresses -join ','
                destinationAddresses = $rule.DestinationAddresses -join ','
                destinationPorts     = $rule.DestinationPorts -join ','
                protocols            = $rule.Protocols -join ','
            }
        }
    }
}
```

**Trap.** A policy can inherit rules from a parent policy (`$policy.BasePolicy`). Collect the parent too, or record it as a gap. Otherwise the hub's broadest rules may be invisible.

### SQL server firewall rules

<!-- listing: lab/listings/powershell/appb-sql-server-firewall-rules.ps1 -->

```powershell
$serverArgs = @{ ResourceGroupName = $server.ResourceGroupName; ServerName = $server.ServerName }
Get-AzSqlServerFirewallRule @serverArgs |
    Select-Object FirewallRuleName, StartIpAddress, EndIpAddress
```

A rule from `0.0.0.0` to `0.0.0.0` (named `AllowAllWindowsAzureIps`) admits any Azure public address, including other customers' resources (Chapter 6) [S27].

### Service tags

<!-- listing: lab/listings/powershell/appb-service-tags.ps1 -->

```powershell
$tags = Get-AzNetworkServiceTag -Location 'eastus2'
$tags.ChangeNumber
$tags.Values | Select-Object Name, @{ n = 'prefixes'; e = { $_.Properties.AddressPrefixes } }
```

Record `ChangeNumber` in the manifest [S28]. Service tag prefixes change, and a reachability answer that depends on `AzureCloud` is only as current as the list it used.

---

## B.8 Telemetry configuration

**Chapters:** 5, 6, 10. **Snapshot file:** `diagnostic-settings.json`.

Whether logging is on decides whether "did access" can be answered at all (Chapter 8). Diagnostic settings are extension resources and aren't in Resource Graph [S11]. Read them through ARM, per resource:

<!-- listing: lab/listings/powershell/appb-telemetry-configuration.ps1 -->

```powershell
$targets = @(
    $account.id,
    "$($account.id)/blobServices/default"
)

$settings = foreach ($target in $targets) {
    Get-AzDiagnosticSetting -ResourceId $target |
        ForEach-Object {
            [pscustomobject]@{
                target      = $target
                name        = $_.Name
                workspaceId = $_.WorkspaceId
                logs        = ($_.Log | Where-Object Enabled |
                    ForEach-Object { $_.Category ?? $_.CategoryGroup }) -join ','
            }
        }
}
```

**Trap.** For storage, blob read logs are configured on the **blob service** (`…/blobServices/default`), not the account [S29]. A setting on the account that collects only metrics looks like logging and records no reads. Record "no setting" explicitly for every target you checked, so the derivation can tell "not logged" from "not checked".

---

## B.9 Observed activity: Log Analytics

**Chapters:** 6, 10. These run in a Log Analytics workspace, not in Resource Graph, and only return data from the date the relevant diagnostic setting was created [S29]. Put that date next to every result.

### Blob reads by caller and authentication type

From Chapter 8, Step 4:

<!-- listing: lab/listings/kql/appb-blob-reads-by-caller-and-authentication.kql -->

```kusto
StorageBlobLogs
| where TimeGenerated > ago(1d)
| where AccountName in ("custdata", "custarchive")
| where OperationName == "GetBlob" and StatusText == "Success"
| summarize reads = count(), first = min(TimeGenerated), last = max(TimeGenerated)
    by AccountName, AuthenticationType, RequesterObjectId, CallerIpAddress
```

Use your suffixed account names from Appendix A's `book_names` output.

**Trap.** Rows with `AuthenticationType` of `AccountKey` or `SAS` have no `RequesterObjectId` [S30]. They show that a key was used, not who used it.

### Storage key listing

From Chapter 8, Step 5:

<!-- listing: lab/listings/kql/appb-storage-key-listing.kql -->

```kusto
AzureActivity
| where TimeGenerated > ago(1d)
| where OperationNameValue =~ "MICROSOFT.STORAGE/STORAGEACCOUNTS/LISTKEYS/ACTION"
| project TimeGenerated, Caller, ResourceGroup, _ResourceId, ActivityStatusValue
```

### Role assignment changes

For Chapter 12's question "did anything else change in the window?":

<!-- listing: lab/listings/kql/appb-role-assignment-changes.kql -->

```kusto
AzureActivity
| where TimeGenerated > ago(7d)
| where OperationNameValue in~ (
    "MICROSOFT.AUTHORIZATION/ROLEASSIGNMENTS/WRITE",
    "MICROSOFT.AUTHORIZATION/ROLEASSIGNMENTS/DELETE")
| where ActivityStatusValue =~ "Success"
| project TimeGenerated, Caller, OperationNameValue, _ResourceId, Properties
```

### Entra credential, owner, and role changes

These need the Entra audit logs exported to the workspace through Entra's own diagnostic settings, which is a tenant-level setting the lab doesn't create [S31]. Without it, the `AuditLogs` table doesn't exist, and the absence is a gap, not a clean result.

<!-- listing: lab/listings/kql/appb-entra-credential-owner-and-role-changes.kql -->

```kusto
AuditLogs
| where TimeGenerated > ago(7d)
| where OperationName has "Certificates and secrets management"
    or OperationName in ("Add service principal credentials", "Add owner to application",
                         "Add owner to service principal")
    or OperationName startswith "Add member to role"
| project TimeGenerated, OperationName, Result,
    actor = coalesce(
        tostring(InitiatedBy.user.userPrincipalName),
        tostring(InitiatedBy.app.displayName)),
    target = tostring(TargetResources[0].displayName)
```

**Trap.** Entra's operation names are display strings, and some contain unusual punctuation and trailing spaces. Match them with `has` or `startswith` and test against an event you created yourself in the lab, as Chapter 12 does for the help desk change.

### Resource property changes

From Chapter 12, section 12.3. Resource Graph, not Log Analytics, and only the last 14 days [S32]:

<!-- listing: lab/listings/kql/appb-resource-property-changes.kql -->

```kusto
resourcechanges
| extend
    targetId = tostring(properties.targetResourceId),
    changeType = tostring(properties.changeType),
    changedAt = todatetime(properties.changeAttributes.timestamp),
    changedBy = tostring(properties.changeAttributes.changedBy),
    clientType = tostring(properties.changeAttributes.clientType),
    changes = properties.changes
| where targetId contains '/storageAccounts/custdata'
| where tostring(changes) contains 'allowSharedKeyAccess'
| project changedAt, changeType, changedBy, clientType, targetId, changes
| order by changedAt desc
```

**Trap.** It covers Azure resources only [S32, S33]. App owners, directory roles, and federated credentials on applications never appear here, which is why Chapter 12 compares snapshots instead.

---

## B.10 Recipe index

| Recipe | Section | Snapshot file | Hops or chapter use |
|--------|---------|---------------|---------------------|
| Readable subscriptions, scope hierarchy | B.2 | `subscriptions.json`, `scope-parents.json` | Gaps (Ch. 3, 12); inheritance (Ch. 4) |
| Role assignments, definitions, deny assignments | B.3 | `role-assignments.json`, `role-definitions.json`, `deny-assignments.json` | H5, H7, H9 |
| Eligible Azure roles | B.3 | `role-eligibility.json` | Eligible paths (Ch. 4, 13) |
| Federated credentials (applications) | B.4 | `federated-credentials.json`, `service-principals.json` | H1; H4 through the `appId` join |
| Federated credentials (managed identities) | B.4 | `managed-identity-federated-credentials.json` | Entry points Chapter 3 misses |
| Application and service principal owners | B.4 | `application-owners.json`, `service-principal-owners.json` | H2 |
| Directory roles and eligibility | B.4 | `directory-role-assignments.json`, `directory-role-eligibility.json` | H3 |
| Transitive membership | B.4 | `transitive-memberships.json` | Group expansion (Ch. 4) |
| Graph application permissions | B.4 | `graph-app-role-assignments.json` | Tenant-wide paths; collector self-check (Ch. 13) |
| Guests | B.4 | `guests.json` | Hygiene (Ch. 1) |
| Storage, local auth, key vaults | B.5 | `storage-accounts.json`, `local-auth.json`, `key-vaults.json` | H6, H7; checklist (Ch. 1) |
| Compute identities | B.5 | `compute-identities.json` | H8 |
| Private endpoint with open public endpoint | B.5 | (Chapter 7 lab) | Ch. 6, 7 |
| Site configuration; declared flows | B.6 | `app-config.json` | Ch. 6, 8 |
| NSGs, VNets, routes, private endpoints, DNS links, public IPs, firewall, SQL, service tags | B.7 | per recipe | Ch. 6, 7 |
| Diagnostic settings | B.8 | `diagnostic-settings.json` | Logging coverage (Ch. 8, 12) |
| Blob reads, key listing, role and Entra changes, resource changes | B.9 | (workspace queries) | Observed activity (Ch. 8, 12) |

---

## Sources

- **[S1]** Microsoft Graph permissions reference. Microsoft Learn. <https://learn.microsoft.com/graph/permissions-reference> Checked 2026-10-12. Kind: documented.
- **[S2]** Understand Azure role definitions. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/role-definitions> Checked 2026-10-12. Kind: documented.
- **[S3]** Work with large data sets. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/concepts/work-with-data> Checked 2026-10-12. Kind: documented.
- **[S4]** Paging Microsoft Graph data in your app. Microsoft Learn. <https://learn.microsoft.com/graph/paging> Checked 2026-10-12. Kind: documented.
- **[S5]** application resource type. Microsoft Learn. <https://learn.microsoft.com/graph/api/resources/application> Checked 2026-10-12. Kind: documented.
- **[S6]** servicePrincipal resource type. Microsoft Learn. <https://learn.microsoft.com/graph/api/resources/serviceprincipal> Checked 2026-10-12. Kind: documented.
- **[S7]** Search-AzGraph. Microsoft Learn. <https://learn.microsoft.com/powershell/module/az.resourcegraph/search-azgraph> Checked 2026-10-12. Kind: documented.
- **[S8]** Overview of Azure Resource Graph. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/overview> Checked 2026-10-12. Kind: documented.
- **[S9]** Use Microsoft Graph PowerShell authentication commands. Microsoft Learn. <https://learn.microsoft.com/powershell/microsoftgraph/authentication-commands> Checked 2026-10-12. Kind: documented.
- **[S10]** Use query parameters to customize responses. Microsoft Learn. <https://learn.microsoft.com/graph/query-parameters> Checked 2026-10-12. Kind: documented.
- **[S11]** Azure Resource Graph table and resource type reference. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/reference/supported-tables-resources> Checked 2026-10-12. Kind: documented.
- **[S12]** Understand the query language. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/concepts/query-language> Checked 2026-10-12. Kind: documented.
- **[S13]** Understand Azure role assignments. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/role-assignments> Checked 2026-10-12. Kind: documented.
- **[S14]** Deny Assignments - List For Scope. Microsoft Learn. <https://learn.microsoft.com/rest/api/authorization/deny-assignments/list-for-scope> Checked 2026-10-12. Version: 2022-04-01. Kind: documented.
- **[S15]** List Azure deny assignments. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/deny-assignments-rest> Checked 2026-10-12. Version: 2022-04-01. Kind: documented.
- **[S16]** Get-AzRoleEligibilityScheduleInstance. Microsoft Learn. <https://learn.microsoft.com/powershell/module/az.resources/get-azroleeligibilityscheduleinstance> Checked 2026-10-12. Kind: documented.
- **[S17]** Migrate GitHub Actions federated credentials to immutable subjects. Microsoft Learn. <https://learn.microsoft.com/entra/workload-id/workload-identities-github-immutable-subjects> Checked 2026-10-12. Kind: documented.
- **[S18]** Azure permissions for Identity. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/permissions/identity> Checked 2026-10-12. Kind: documented.
- **[S19]** List group transitive members. Microsoft Learn. <https://learn.microsoft.com/graph/api/group-list-transitivemembers> Checked 2026-10-12. Kind: documented.
- **[S20]** user resource type. Microsoft Learn. <https://learn.microsoft.com/graph/api/resources/user> Checked 2026-10-12. Kind: documented.
- **[S21]** Prevent authorization with Shared Key. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/shared-key-authorization-prevent> Checked 2026-10-12. Kind: documented.
- **[S22]** Disable local authentication with Azure Service Bus. Microsoft Learn. <https://learn.microsoft.com/azure/service-bus-messaging/disable-local-authentication> Checked 2026-10-12. Kind: documented.
- **[S23]** Provide access to Key Vault keys, certificates, and secrets with Azure role-based access control. Microsoft Learn. <https://learn.microsoft.com/azure/key-vault/general/rbac-guide> Checked 2026-10-12. Kind: documented.
- **[S24]** Azure permissions for Web and Mobile. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/permissions/web-and-mobile> Checked 2026-10-12. Kind: documented.
- **[S25]** Azure network security groups overview. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview> Checked 2026-10-12. Kind: documented.
- **[S26]** Create, change, or delete Azure virtual network peering. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/virtual-network-manage-peering> Checked 2026-10-12. Kind: documented.
- **[S27]** IP Firewall Rules - Azure SQL Database. Microsoft Learn. <https://learn.microsoft.com/azure/azure-sql/database/firewall-configure> Checked 2026-10-12. Kind: documented.
- **[S28]** Get-AzNetworkServiceTag. Microsoft Learn. <https://learn.microsoft.com/powershell/module/az.network/get-aznetworkservicetag> Checked 2026-10-12. Kind: documented.
- **[S29]** Monitor Azure Blob Storage. Microsoft Learn. <https://learn.microsoft.com/azure/storage/blobs/monitor-blob-storage> Checked 2026-10-12. Kind: documented.
- **[S30]** Azure Monitor Logs reference - StorageBlobLogs. Microsoft Learn. <https://learn.microsoft.com/azure/azure-monitor/reference/tables/storagebloblogs> Checked 2026-10-12. Kind: documented.
- **[S31]** Integrate Microsoft Entra logs with Azure Monitor logs. Microsoft Learn. <https://learn.microsoft.com/entra/identity/monitoring-health/howto-integrate-activity-logs-with-azure-monitor-logs> Checked 2026-10-12. Kind: documented.
- **[S32]** Analyze changes to your Azure resources with Change Analysis. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/changes/resource-graph-changes> Checked 2026-10-12. Kind: documented.
- **[S33]** Get resource changes. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/changes/get-resource-changes> Checked 2026-10-12. Kind: documented.

---

## Author notes (remove before submission)

- **Taken from the chapters, matching their text:** the scope, role assignment, role definition, deny assignment, compute identity, scope hierarchy, private-endpoint, `StorageBlobLogs`, and list-keys queries; the Graph calls referenced from Chapters 3 and 5. If a chapter's query changes, change it here.
- **New in this appendix, not yet run against a live tenant:** the combined storage query in B.5 (Chapter 3's columns plus Chapter 6's network fields); managed identity federated credentials; service principal owners; directory role eligibility; Graph application permissions; guests; local authentication; key vaults; site configuration; NSG, virtual network, route table, private endpoint, private DNS link, public IP, firewall policy, SQL firewall, and service tag recipes; diagnostic settings; role assignment and Entra audit queries; `resourcechanges`. Run each against Appendix A's lab and record the result before submission.
- Specific things to confirm: that Resource Graph indexes `microsoft.network/privatednszones/virtualnetworklinks` in every cloud the book targets; the `Get-AzFederatedIdentityCredential` parameter names in the current Az.ManagedServiceIdentity module; the exact Entra audit operation names for federated credential changes on applications (they may appear as a generic "Update application" with a modified property). (The `??` operator in B.8 is fine: the book requires PowerShell 7, and `tools/check_powershell_listings.ps1` parses every listing with it.)
- 2026-10-11 (listing sync): every KQL block here is synced from `lab/listings/kql/` or `lab/queries/`. `tools/check_kql_listings.py` only checks structure (balanced brackets and quotes, a known table first, no leading pipe). It doesn't prove a query runs; the live runbook ([`../lab/live-validation-runbook.md`](../lab/live-validation-runbook.md)) does.
- Appendix A's `checklist.kql` matches only `destinationPortRange`, which is correct for the lab. Its header comment now points readers at B.7's fuller pattern.
- Consider moving the recipes the labs run (B.4 managed identity credentials, B.7 network) into `lab/queries` once Chapter 7's lab is walked against a live tenant.
- 2026-10-12 (sources): added 32 sources. Changed: B.3 deny assignments — clarified that deny assignments are collected through the Authorization REST API, not `authorizationresources` per the Resource Graph table reference. The KQL listing `appb-deny-assignments.kql` is replaced by `lab/listings/powershell/appb-deny-assignments.ps1` (REST, api-version 2022-04-01, one row per permission block, same columns), shared with Chapter 5 Step 0. Run it against the live lab before submission. Softened: none. Unverified: none.
- 2026-10-12 (sources): resolved the open question about child scopes. Per "List Azure deny assignments" (REST, filter table), an unfiltered subscription-level list returns deny assignments at, above, and below the scope, so no per-resource-group calls are needed. B.3 cites it as a new source.
