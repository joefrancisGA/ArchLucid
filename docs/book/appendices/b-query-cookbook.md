> **Scope:** Appendix B first draft for the book draft *Managing Azure Security with AI*: a cookbook of read-only Azure Resource Graph, Microsoft Graph, Azure Resource Manager, and Log Analytics queries that collect the evidence the chapters use. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Appendix B — Query cookbook

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md) · **Lab:** [Appendix A](a-companion-lab.md) · **Query files:** [`../lab/queries`](../lab/queries)

> *Draft status: first draft. Queries taken from Chapters 3–6 and 10 match the chapter text. The recipes new in this appendix were written against current documentation in October 2026 and have not yet been run against a live tenant; the author notes list which are which.*

This appendix collects the queries the book uses, plus the ones the chapters describe without printing, in one place. Each recipe says which chapter needs it, which snapshot file it feeds, and the trap that most often makes it wrong.

Every recipe here is **read-only**. With one exception called out in B.6, the collector identity from Chapter 3 can run them all: Reader at the scope you collect, plus the four Microsoft Graph application permissions (`Application.Read.All`, `GroupMember.Read.All`, `User.Read.All`, `RoleManagement.Read.Directory`). Where a recipe needs more, it says so, and the missing permission is a gap to record, not a reason to widen the collector quietly.

Hop labels (H1–H9) and path labels (P1–P6) are the IDs from Chapter 7's evidence pack (section 7.3).

---

## B.1 Rules that apply to every recipe

Chapter 3 found four traps that models and people both fall into. They apply to every query below, so they're stated once here.

1. **Absent isn't false.** Many security properties are missing until someone sets them, and missing usually means the platform default, which is often the permissive one. Keep "not set" as its own value, then let the derivation apply the documented default and say so.
2. **Join role definitions on the GUID.** The same built-in role appears under different full IDs depending on the scope that references it. The trailing GUID is stable.
3. **Read every page.** Resource Graph returns up to 1,000 rows per call, and Microsoft Graph pages too. A collector that reads one page loses data without an error.
4. **Applications aren't service principals.** Federated credentials and app owners attach to the application object; Azure role assignments point at the service principal. Join them through `appId`.

Two more come from the later chapters:

5. **A failed query is a gap, never an empty result.** Throttling, a 403, or an unreadable subscription must land in the manifest's gap list (Chapter 3, section 3.7). An empty file means "we looked and found nothing", and you must only write one when that's true.
6. **Test against a known answer.** Before a new query goes into the collector, run it against the lab, where Appendix A says what it should return. A query that finds the six paths' inputs in the lab has earned a place; one that has only been reviewed hasn't.

### Running Resource Graph queries

Use Chapter 3's `Invoke-ArgQuery` (section 3.10, Step 1). It pages with the skip token, runs at tenant scope with `-UseTenantScope`, and turns any failure into a `partialResult` gap. Every Resource Graph recipe below is written to be saved as a `.kql` file and passed to it:

```powershell
Invoke-ArgQuery -Name 'nsg-rules' -Query (Get-Content queries/nsg-rules.kql -Raw)
```

Resource Graph only returns rows from subscriptions the caller can read, silently. Section B.2's scope recipe is what turns that silence into a recorded gap.

### Running Microsoft Graph calls

Use the Microsoft Graph PowerShell SDK, connected with `Connect-MgGraph -Identity`, and pass `-All` to every `Get-Mg…` list call so the SDK follows the paging links. Ask for the properties you need with `-Property`. Graph omits many properties by default, and an omitted property looks exactly like an empty one.

### Running Azure Resource Manager calls

Some evidence isn't in Resource Graph at all: diagnostic settings, App Service access restrictions, SQL firewall rules, and firewall policy rule collections. For those, call Azure Resource Manager (ARM) directly. The Az cmdlets named below do that, and `Invoke-AzRestMethod -Method GET` works for anything without a cmdlet. Wrap each call in the same try/catch pattern as `Invoke-ArgQuery`, so a 403 becomes an `apiNotPermitted` gap.

---

## B.2 Scope: what the collector can and should see

**Chapters:** 3, 10. **Snapshot files:** `subscriptions.json`, `scope-parents.json`, `expected-subscriptions.json`.

The subscriptions the collector can read (Chapter 3, section 3.3):

```kusto
resourcecontainers
| where type =~ 'microsoft.resources/subscriptions'
| project subscriptionId, name, properties.state
```

The scope hierarchy, so role assignments at a management group or resource group can be inherited down to the resources beneath them (Chapter 4, Step 0):

```kusto
resourcecontainers
| extend parentId = case(
    type =~ 'microsoft.resources/subscriptions/resourcegroups', strcat('/subscriptions/', subscriptionId),
    type =~ 'microsoft.management/managementgroups', tostring(properties.details.parent.id),
    '')
| project id, name, type, parentId
```

**Trap.** Neither query tells you which subscriptions *exist*. That needs a source with wider visibility: the management group hierarchy read from the root (`Get-AzManagementGroup -GroupName <root id> -Expand -Recurse`), a list from the platform team, or billing records. If the collector can't read the root, the expected list is a human assertion. Record who gave it and when, and compare it on every run.

---

## B.3 Authorization: Azure RBAC

**Chapters:** 2, 3, 4, 9, 10. **Snapshot files:** `role-assignments.json`, `role-definitions.json`, `deny-assignments.json`, `role-eligibility.json`.

### Role assignments with role names

From Chapter 3, section 3.3. It's the query behind hops H5 and H9.

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

**Trap.** Keep `condition`, even though it's usually empty. A condition can narrow what the role allows, and Chapter 2 listed "no role condition" as a checked assumption.

### Role definitions with their actions

From Chapter 4, Step 0. Paths come from actions, not role names, so this is what turns "Contributor" into "can list storage keys".

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

**Trap.** `actions` and `dataActions` are separate. Control-plane `*` doesn't grant data-plane reads, which is why Contributor needs list keys (H7) to read blobs while a data role reads them directly.

### Deny assignments

From Chapter 4, Step 0. A deny assignment can remove an edge that a role assignment created.

```kusto
authorizationresources
| where type =~ 'microsoft.authorization/denyassignments'
| mv-expand permission = properties.permissions
| project
    id,
    scope = tostring(properties.scope),
    doNotApplyToChildScopes = tobool(properties.doNotApplyToChildScopes),
    principals = properties.principals,
    actions = permission.actions,
    notActions = permission.notActions,
    dataActions = permission.dataActions,
    notDataActions = permission.notDataActions
```

### Eligible Azure roles (Privileged Identity Management)

Chapter 4's Rule 5 says eligible isn't active, and Chapter 11 asks the search to report eligible paths separately. Eligibility isn't in the role assignment rows. Read it through ARM at each scope you collect:

```powershell
Get-AzRoleEligibilityScheduleInstance -Scope "/subscriptions/$subscriptionId" |
    Select-Object PrincipalId, PrincipalType, RoleDefinitionId, Scope, EndDateTime
```

**Trap.** PIM has *schedules*, which describe a grant as requested, and *instances*, which describe what's in effect. Collect instances, and keep `EndDateTime` so an analyst can see when an eligibility lapses.

---

## B.4 Authorization: Entra ID

**Chapters:** 2, 4, 9, 10. **Snapshot files:** `federated-credentials.json`, `service-principals.json`, `application-owners.json`, `service-principal-owners.json`, `directory-role-assignments.json`, `directory-role-eligibility.json`, `transitive-memberships.json`, `graph-app-role-assignments.json`, `managed-identity-federated-credentials.json`.

### Federated credentials on applications

Chapter 3, section 3.4, prints the loop. It reads every application with `Get-MgApplication -All -Property 'id,appId,displayName'`, then `Get-MgApplicationFederatedIdentityCredential` for each, and keeps `appId`, `issuer`, `subject`, and `audiences`. It's hop H1.

**Trap.** Record the subject exactly as stored. GitHub now issues two subject formats, and the broad patterns Chapter 4 warns about are a property of the string.

### Federated credentials on user-assigned managed identities

Managed identities can trust external tokens too, and Chapter 3's loop doesn't see them, because they live in Azure rather than in the application list. A federated credential on `mi-payments-api` would be an entry point straight to `custdata`. Collect them per identity:

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

**Trap.** Who can *add* one of these matters as much as who has one. Writing a federated credential is an ARM action on the identity, so Contributor at the identity's resource group can do it. That's why Appendix A keeps `mi-payments-api` out of `rg-payments-prod`.

### Owners: applications and service principals

Application owners can add credentials to the application (hop H2). Chapter 4, Step 0, prints the loop, using `Get-MgApplicationOwner -ApplicationId $app.Id -All`.

Service principals have owners of their own, separate from the application's, and an owner of a service principal can manage it too. Collect them the same way:

```powershell
$servicePrincipals = Get-MgServicePrincipal -All -Property 'id,appId,displayName,servicePrincipalType'

$spOwners = foreach ($sp in $servicePrincipals) {
    Get-MgServicePrincipalOwner -ServicePrincipalId $sp.Id -All |
        ForEach-Object {
            [pscustomobject]@{ spObjectId = $sp.Id; appId = $sp.AppId; ownerId = $_.Id }
        }
}
```

**Trap.** In a large tenant, one call per object is slow. Get it right first, then batch. A fast collector that skips owners hides H2 entirely.

### Directory role assignments and eligibility

Chapter 4, Step 0, prints the assignment loop: `Get-MgRoleManagementDirectoryRoleAssignment -All`, joined to `Get-MgRoleManagementDirectoryRoleDefinition -All` for names, keeping `directoryScopeId`. It's hop H3.

Eligible directory roles come from a different call, under the same permission:

```powershell
Get-MgRoleManagementDirectoryRoleEligibilitySchedule -All |
    Select-Object PrincipalId, RoleDefinitionId, DirectoryScopeId, MemberType
```

**Trap.** Keep `directoryScopeId`. Cloud Application Administrator at `/` fans out to every application; the same role scoped to an administrative unit doesn't. That one column is the difference between H3 and no path.

### Transitive group membership

Chapter 4, Step 0: `Get-MgGroupTransitiveMember -GroupId $groupId -All` for every group that holds an Azure role or a directory role. Use the transitive call. Direct members hide nested groups.

### Microsoft Graph application permissions

A service principal with a powerful Graph application permission, such as `RoleManagement.ReadWrite.Directory` or `Application.ReadWrite.All`, can create paths of its own. List what each service principal holds against Microsoft Graph:

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

The collector's own four permissions should appear in the output. That's a cheap self-check, and Chapter 11's governance review can use it.

### Guests

```powershell
Get-MgUser -All -Filter "userType eq 'Guest'" `
    -Property 'id,displayName,mail,externalUserState,createdDateTime'
```

`externalUserState` of `PendingAcceptance` is Appendix A's never-redeemed guest. Last sign-in time is in `signInActivity`, which needs `AuditLog.Read.All`. The Chapter 3 collector doesn't hold it, so "no recent sign-in" is a gap unless you grant that permission deliberately.

---

## B.5 Resources and data stores

**Chapters:** 1, 2, 3, 5, 9, 10. **Snapshot files:** `storage-accounts.json`, `compute-identities.json`, `local-auth.json`, `key-vaults.json`.

### Storage accounts: shared key and exposure

Chapter 3's query, with its shared key handling, and the network fields Chapter 5's `storage_public_exposure` reads. It's hops H6 and H7, and the input to the Chapter 1 checklist.

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

**Trap.** Keep `publicNetworkAccess` empty when it's empty. Chapter 5 explains why an unset value is not "Disabled".

### Local authentication on other services

Shared key is storage's name for a pattern that recurs: a key or connection string that works without an identity, and destroys attribution (Chapter 6). Other services expose it as `disableLocalAuth`, where absent usually means local authentication is **allowed**:

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

**Trap.** A vault that uses access policies instead of Azure RBAC grants data access *outside* role assignments. Its `accessPolicies` entries are edges your role-assignment query never sees. Treat each object ID in them as holding the listed secret, key, and certificate permissions on that vault.

### Compute identities

From Chapter 4, Step 0. It links each workload to the identities it runs as (hop H8):

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

From Chapter 5, section 5.3. It's the first step of that chapter's lab:

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

Chapter 6's declared flows come from configuration: which store an app is configured to talk to, and as which identity. This is the one place where Reader isn't enough, and where the read-only rule and the never-collect-secrets rule (Chapter 3, section 3.6) collide.

**Site configuration** is readable with Reader. It holds the inbound access restrictions Chapter 5 needs, including whether the advanced tools (SCM) site follows the main site's rules:

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

**App settings aren't.** Reading them is a separate `list` action (`Microsoft.Web/sites/config/list/action`) that Reader doesn't include, and it returns every value, secrets included. You can't get the names without the values. You have three options, in order of preference:

1. **Read declared flows from infrastructure as code.** The Terraform that created the app names the setting and the store, and reading a repository needs no Azure permission at all. Appendix A's `ARCHIVE_ACCOUNT` and `CUSTOMER_ACCOUNT` settings are in `payments.tf`.
2. **Rely on the declared flows Reader can see.** Chapter 6 counts a data-plane role held by a workload identity as a declared flow, and B.3 and B.5 already collect both halves: the role assignment, and which workload runs as that identity. Private endpoints and integration configuration add more. What you lose is any app that reaches a store with a key or connection string instead of an identity. Those leave no role assignment behind, and they're the flows Chapter 6 most wants you to find, which is why option 1 comes first.
3. **Grant the list action to a separate, narrowly scoped identity** that strips values before anything is written, keeping only setting names and values that name a resource. That identity can read secrets, so it belongs in Chapter 11's governance review, not in the everyday collector.

Whichever you use, record which in the manifest, so a reader knows whether the app setting evidence came from code, from live settings, or wasn't collected.

---

## B.7 Network reachability

**Chapter:** 5. **Snapshot files:** `nsg-rules.json`, `vnets.json`, `route-tables.json`, `private-endpoints.json`, `private-dns-links.json`, `public-ips.json`, `firewall-rules.json`, `service-tags.json`, `sql-firewall-rules.json`.

Chapter 5, section 5.6, lists what reachability needs. These are the queries behind that list.

### NSG rules

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

**Trap.** Each rule has a singular field and a plural one for addresses and ports, and only one is filled. Appendix A's checklist query reads only `destinationPortRange`, which is fine for its single-port lab rule and not enough in general: a rule allowing `3389` inside `destinationPortRanges`, or a range like `3000-4000`, slips past it. Keep both fields and evaluate ranges in code, as Chapter 5's `evaluate_inbound` does.

Keep the default rules too. `AllowVnetInBound` is why "no custom rule" doesn't mean "no traffic".

### Virtual networks, subnets, and peerings

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

**Trap.** Peering isn't transitive. Spoke A peered to the hub and spoke B peered to the hub can't talk unless a route sends their traffic through something in the hub that forwards it. That's why the route tables matter.

### Route tables

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

```kusto
resources
| where type =~ 'microsoft.network/privatednszones/virtualnetworklinks'
| project
    id,
    zone = tostring(split(id, '/')[8]),
    virtualNetworkId = tostring(properties.virtualNetwork.id),
    registrationEnabled = tobool(properties.registrationEnabled)
```

**Trap.** A private endpoint only helps a client whose DNS resolves the service name to the private address. That depends on which virtual networks the zone is linked to, which is Chapter 5 Step 5's surprise: the lab's zone is linked to the payments spoke only, so the dev spoke resolves `custdata` to its public address.

### Public IP addresses

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

```powershell
Get-AzSqlServerFirewallRule -ResourceGroupName $server.ResourceGroupName -ServerName $server.ServerName |
    Select-Object FirewallRuleName, StartIpAddress, EndIpAddress
```

A rule from `0.0.0.0` to `0.0.0.0` (named `AllowAllWindowsAzureIps`) admits any Azure public address, including other customers' resources (Chapter 5).

### Service tags

```powershell
$tags = Get-AzNetworkServiceTag -Location 'eastus2'
$tags.ChangeNumber
$tags.Values | Select-Object Name, @{ n = 'prefixes'; e = { $_.Properties.AddressPrefixes } }
```

Record `ChangeNumber` in the manifest. Service tag prefixes change, and a reachability answer that depends on `AzureCloud` is only as current as the list it used.

---

## B.8 Telemetry configuration

**Chapters:** 5, 6, 10. **Snapshot file:** `diagnostic-settings.json`.

Whether logging is on decides whether "did access" can be answered at all (Chapter 6). Diagnostic settings are extension resources and aren't in Resource Graph. Read them through ARM, per resource:

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
                logs        = ($_.Log | Where-Object Enabled | ForEach-Object { $_.Category ?? $_.CategoryGroup }) -join ','
            }
        }
}
```

**Trap.** For storage, blob read logs are configured on the **blob service** (`…/blobServices/default`), not the account. A setting on the account that collects only metrics looks like logging and records no reads. Record "no setting" explicitly for every target you checked, so the derivation can tell "not logged" from "not checked".

---

## B.9 Observed activity: Log Analytics

**Chapters:** 6, 10. These run in a Log Analytics workspace, not in Resource Graph, and only return data from the date the relevant diagnostic setting was created. Put that date next to every result.

### Blob reads by caller and authentication type

From Chapter 6, Step 4:

```kusto
StorageBlobLogs
| where TimeGenerated > ago(1d)
| where AccountName in ("custdata", "custarchive")
| where OperationName == "GetBlob" and StatusText == "Success"
| summarize reads = count(), first = min(TimeGenerated), last = max(TimeGenerated)
    by AccountName, AuthenticationType, RequesterObjectId, CallerIpAddress
```

Use your suffixed account names from Appendix A's `book_names` output.

**Trap.** Rows with `AuthenticationType` of `AccountKey` or `SAS` have no `RequesterObjectId`. They show that a key was used, not who used it.

### Storage key listing

From Chapter 6, Step 5:

```kusto
AzureActivity
| where TimeGenerated > ago(1d)
| where OperationNameValue =~ "MICROSOFT.STORAGE/STORAGEACCOUNTS/LISTKEYS/ACTION"
| project TimeGenerated, Caller, ResourceGroup, _ResourceId, ActivityStatusValue
```

### Role assignment changes

For Chapter 10's question "did anything else change in the window?":

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

These need the Entra audit logs exported to the workspace through Entra's own diagnostic settings, which is a tenant-level setting the lab doesn't create. Without it, the `AuditLogs` table doesn't exist, and the absence is a gap, not a clean result.

```kusto
AuditLogs
| where TimeGenerated > ago(7d)
| where OperationName has "Certificates and secrets management"
    or OperationName in ("Add service principal credentials", "Add owner to application",
                         "Add owner to service principal")
    or OperationName startswith "Add member to role"
| project TimeGenerated, OperationName, Result,
    actor = coalesce(tostring(InitiatedBy.user.userPrincipalName), tostring(InitiatedBy.app.displayName)),
    target = tostring(TargetResources[0].displayName)
```

**Trap.** Entra's operation names are display strings, and some contain unusual punctuation and trailing spaces. Match them with `has` or `startswith` and test against an event you created yourself in the lab, as Chapter 10 does for the help desk change.

### Resource property changes

From Chapter 10, section 10.3. Resource Graph, not Log Analytics, and only the last 14 days:

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

**Trap.** It covers Azure resources only. App owners, directory roles, and federated credentials on applications never appear here, which is why Chapter 10 compares snapshots instead.

---

## B.10 Recipe index

| Recipe | Section | Snapshot file | Hops or chapter use |
|--------|---------|---------------|---------------------|
| Readable subscriptions, scope hierarchy | B.2 | `subscriptions.json`, `scope-parents.json` | Gaps (Ch. 3, 10); inheritance (Ch. 4) |
| Role assignments, definitions, deny assignments | B.3 | `role-assignments.json`, `role-definitions.json`, `deny-assignments.json` | H5, H7, H9 |
| Eligible Azure roles | B.3 | `role-eligibility.json` | Eligible paths (Ch. 4, 11) |
| Federated credentials (applications) | B.4 | `federated-credentials.json`, `service-principals.json` | H1; H4 through the `appId` join |
| Federated credentials (managed identities) | B.4 | `managed-identity-federated-credentials.json` | Entry points Chapter 3 misses |
| Application and service principal owners | B.4 | `application-owners.json`, `service-principal-owners.json` | H2 |
| Directory roles and eligibility | B.4 | `directory-role-assignments.json`, `directory-role-eligibility.json` | H3 |
| Transitive membership | B.4 | `transitive-memberships.json` | Group expansion (Ch. 4) |
| Graph application permissions | B.4 | `graph-app-role-assignments.json` | Tenant-wide paths; collector self-check (Ch. 11) |
| Guests | B.4 | `guests.json` | Hygiene (Ch. 1) |
| Storage, local auth, key vaults | B.5 | `storage-accounts.json`, `local-auth.json`, `key-vaults.json` | H6, H7; checklist (Ch. 1) |
| Compute identities | B.5 | `compute-identities.json` | H8 |
| Private endpoint with open public endpoint | B.5 | (Chapter 5 lab) | Ch. 5 |
| Site configuration; declared flows | B.6 | `app-config.json` | Ch. 5, 6 |
| NSGs, VNets, routes, private endpoints, DNS links, public IPs, firewall, SQL, service tags | B.7 | per recipe | Ch. 5 |
| Diagnostic settings | B.8 | `diagnostic-settings.json` | Logging coverage (Ch. 6, 10) |
| Blob reads, key listing, role and Entra changes, resource changes | B.9 | (workspace queries) | Observed activity (Ch. 6, 10) |

---

## Author notes (remove before submission)

- **Taken from the chapters, matching their text:** the scope, role assignment, role definition, deny assignment, compute identity, scope hierarchy, private-endpoint, `StorageBlobLogs`, and list-keys queries; the Graph calls referenced from Chapters 3 and 4. If a chapter's query changes, change it here.
- **New in this appendix, not yet run against a live tenant:** the combined storage query in B.5 (Chapter 3's columns plus Chapter 5's network fields); managed identity federated credentials; service principal owners; directory role eligibility; Graph application permissions; guests; local authentication; key vaults; site configuration; NSG, virtual network, route table, private endpoint, private DNS link, public IP, firewall policy, SQL firewall, and service tag recipes; diagnostic settings; role assignment and Entra audit queries; `resourcechanges`. Run each against Appendix A's lab and record the result before submission.
- Specific things to confirm: that Resource Graph indexes `microsoft.network/privatednszones/virtualnetworklinks` in every cloud the book targets; the `Get-AzFederatedIdentityCredential` parameter names in the current Az.ManagedServiceIdentity module; the exact Entra audit operation names for federated credential changes on applications (they may appear as a generic "Update application" with a modified property); and that the `??` operator in B.8 is acceptable given the book requires PowerShell 7.
- Appendix A's `checklist.kql` matches only `destinationPortRange`, which is correct for the lab. Its header comment now points readers at B.7's fuller pattern.
- Consider moving the recipes the labs run (B.4 managed identity credentials, B.7 network) into `lab/queries` once Chapter 5's lab is walked against a live tenant.
