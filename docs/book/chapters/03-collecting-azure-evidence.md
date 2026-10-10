> **Scope:** Chapter 3 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Chapter 3 — Collecting Azure evidence read-only

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 8,000 words. Facts about Azure behavior, API names, and cmdlet parameters must be re-verified against Microsoft documentation before submission.*

---

## The clean report

In this fictional scenario, a platform engineer at Contoso wrote a script to look for exactly the kind of path Chapter 1 described. It queried Azure Resource Graph for role assignments and storage accounts, joined them, and listed every identity that could reach a storage account with shared key access enabled.

They ran it from their own laptop, signed in as themselves. It finished in under a minute and found nothing alarming. The engineer was pleased and said so in the team channel.

The payments path was there the whole time. The script didn't find it because the engineer's account had no access to the payments production subscription. Azure Resource Graph doesn't return an error for subscriptions you can't read. It just returns results from the ones you can. From the script's point of view, the payments subscription didn't exist.

Nothing in the output said "I couldn't see two of your eleven production subscriptions." The report was clean because the collector was blind, and nobody could tell the difference.

This chapter is about collecting the evidence that path analysis depends on, and doing it so the result tells you what it *couldn't* see as clearly as what it could. It covers:

- what evidence a path needs,
- which identity should collect it, and with what permissions,
- the two main sources: Azure Resource Graph and Microsoft Graph,
- packaging each collection as a snapshot you can trust later,
- why secret values never belong in the evidence,
- recording gaps as first-class results.

The running example is the payments path from Chapters 1 and 2. By the end of the chapter, you'll have collected every observed fact in Chapter 2's hop table, with a source and a timestamp for each.

---

## 3.1 What evidence a path needs

A path is a chain of hops, and each kind of hop needs a different kind of evidence. Before writing any queries, list what you need. It's easy to collect a great deal of inventory and still be missing the one relationship that connects two parts of a path.

Most Azure paths are built from five kinds of evidence:

| Kind | What it answers | Examples |
|------|-----------------|----------|
| **Identity** | Who exists, and how they relate | Users, groups, nested group membership, app registrations, service principals, managed identities, federated identity credentials |
| **Authorization** | Who may do what, where | Role assignments, role definitions, deny assignments, conditions on assignments, eligible (PIM) assignments, Entra directory roles |
| **Resources** | What exists, and how it's configured | Resource inventory with security-relevant properties: shared key access, public network access, local authentication, TLS settings |
| **Network** | What can reach what | Virtual networks, subnets, NSGs and rules, private endpoints, firewall rules, route tables, peering |
| **Telemetry configuration** | What you'd be able to observe | Diagnostic settings, log destinations, retention |

The fifth row is easy to forget. It doesn't create paths. It tells you whether you'd know if a path had been used, which decides what you're allowed to claim (Chapter 2, hop 8).

Two kinds of evidence are deliberately *not* in this chapter:

- **Activity**: sign-in logs, Activity Log entries, storage access logs. These are evidence of what *happened*, not what's *possible*. They matter for confirming flows (Chapter 6) and verifying fixes (Chapter 10), and they have different retention, cost, and privacy considerations.
- **Secret values**: keys, connection strings, passwords, tokens. Section 3.6 explains why the collector should never hold them.

### Map the payments path to evidence

Here are the observed facts from Chapter 2's hop table, with where each one comes from:

| Hop | Observed fact | Kind | Source |
|-----|---------------|------|--------|
| 1 | `payments-deploy` trusts GitHub Actions tokens from `main` | Identity | Microsoft Graph: application's federated identity credentials |
| 3 | `payments-deploy`'s service principal holds Contributor on `rg-payments-prod` | Authorization | Azure Resource Graph: `authorizationresources` |
| 4 (input) | `custdata` is in `rg-payments-prod` | Resources | Azure Resource Graph: `resources` |
| 5 | `custdata` allows shared key access | Resources | Azure Resource Graph: storage account properties |
| 6 (assumptions) | No deny assignment, no role condition, public network access setting | Authorization, Network | Azure Resource Graph or ARM APIs |
| 8 (input) | No blob read diagnostic logging on `custdata` | Telemetry configuration | ARM: diagnostic settings on the storage account's blob service |

Notice that hop 1 comes from Microsoft Graph and hop 3 from Azure Resource Graph. A collector that only uses one of them can't connect the repository to the resource group. That's the most common reason homegrown path scripts miss identity-based paths: the identity half and the authorization half live in different APIs.

---

## 3.2 Who collects, and with what permissions

The collector's identity is a design decision with security consequences in both directions. Too little access, and you get the clean report from the opening. Too much access, and the collector becomes one of the most valuable identities in your tenant.

### Read, not write

The collector needs to **read** configuration. It never needs to **change** anything. That sounds obvious, but many organizations run security scanners with Contributor or Owner "to avoid permission errors". That turns the scanner into exactly the kind of identity Chapter 1 warned about: broad, rarely reviewed, and reachable from wherever the scanner runs.

For Azure Resource Manager, the built-in **Reader** role is the right starting point. Assign it at the highest scope you want covered, ideally the tenant root management group, so new subscriptions are covered automatically when they're created.

Reader has a useful property: it grants read actions but not the list-secrets actions that many services expose separately. A Reader can see that a storage account exists and how it's configured, but can't call `listKeys`. It can see an App Service's configuration, but not the values of its application settings. Reader keeps the collector from accidentally collecting secrets.

> **As of 2026-10:** Verify the current definition of Reader and any service-specific exceptions before relying on this in a design review. Role definitions change, and a few services expose sensitive data through read actions.

### Microsoft Graph: narrow application permissions

Identity evidence comes from Microsoft Graph, which uses its own permission model. The collector needs **application permissions**, because it runs unattended, and only read permissions. A typical minimal set:

| Permission | Why |
|------------|-----|
| `Application.Read.All` | App registrations, service principals, federated identity credentials |
| `GroupMember.Read.All` | Group memberships, including nested membership |
| `User.Read.All` | Users referenced by memberships and role assignments |
| `RoleManagement.Read.Directory` | Entra directory role assignments and eligibility |

Avoid `Directory.Read.All` unless you need its breadth. Every application permission requires admin consent, and the narrower set is easier to justify to your identity team.

> **As of 2026-10:** Check each permission's exact scope in the Microsoft Graph permissions reference. Names and coverage have shifted over time, especially around role management.

### No secrets for the collector either

Run the collector with a **managed identity** if it runs in Azure, or with **workload identity federation** if it runs in a CI system. That's the same mechanism as `payments-deploy`, and for the same reason: there's no stored secret to leak.

That's a nice irony. The collector looking for over-privileged federated identities should itself be a narrowly privileged federated identity. Chapter 11 returns to governing the collector as a sensitive system in its own right.

### Don't run it as yourself

The opening story's mistake was running the collector as a person. A person's access reflects their job, not the collection's needs. It varies between people and changes when they move teams. A collection run under a dedicated identity with documented permissions produces results you can compare over time. A collection run as whoever happened to run it doesn't.

---

## 3.3 Azure Resource Graph

Azure Resource Graph (ARG) is the workhorse for resource and authorization evidence. It lets you query resource properties across many subscriptions at once using the Kusto Query Language (KQL), and it's fast enough to run against large estates in seconds.

ARG exposes several tables. The three you'll use most:

- `resources` — almost every Azure resource, with its properties as JSON.
- `resourcecontainers` — subscriptions, resource groups, and management groups.
- `authorizationresources` — role assignments, role definitions, and related authorization data.

### Storage accounts and shared key access

```kusto
resources
| where type =~ 'microsoft.storage/storageaccounts'
| project
    id,
    name,
    subscriptionId,
    resourceGroup,
    allowSharedKeyAccess = properties.allowSharedKeyAccess,
    publicNetworkAccess = properties.publicNetworkAccess,
    minimumTlsVersion = properties.minimumTlsVersion
```

One trap: `allowSharedKeyAccess` is often **absent** from the properties rather than set to `true`. Absent means the platform default applies, and the default has historically been to *allow* shared key access. A query that filters on `allowSharedKeyAccess == true` will miss every account where the property was never set, which in older estates is most of them.

Handle absence explicitly and keep it visible:

```kusto
| extend sharedKey = case(
    isnull(properties.allowSharedKeyAccess), 'not set (platform default)',
    tobool(properties.allowSharedKeyAccess), 'enabled',
    'disabled')
```

Recording "not set (platform default)" rather than collapsing it to "enabled" keeps the observation honest. Your *derivation* can then apply the default rule and say so. Chapter 2 called this the difference between an observed fact and a derived fact.

> **As of 2026-10:** Verify the current default for `allowSharedKeyAccess` on new and existing storage accounts.

### Role assignments with role names

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

Two details in that query deserve comment.

First, **join on the role definition's GUID, not its full ID.** The same built-in role appears with different full resource IDs depending on the scope it's referenced from. Matching on the full ID silently drops rows. The trailing GUID is stable.

Second, **keep the `condition` column**, even though it's usually empty. Role assignment conditions can restrict what a role actually allows. Chapter 2's hop 6 listed "no role condition" as a checked assumption, and this is where that check comes from.

### Paging and throttling

ARG returns results in pages, so a collector that reads only the first page will miss data without any error. In PowerShell, `Search-AzGraph` takes `-First` (up to 1,000 rows per call) and returns a skip token when more results exist. Loop until there's no token. ARG also throttles heavy callers, so build in a back-off and record any query that didn't complete as a gap (section 3.7), not as an empty result.

### The silent-scope problem

Back to the opening story. ARG evaluates each query against the subscriptions the caller can read, and returns results only from those. A subscription you can't read doesn't raise an error. It simply contributes zero rows.

That behavior is convenient for interactive use and dangerous for security collection. The fix is to collect the **expected** scope separately and compare:

```kusto
resourcecontainers
| where type =~ 'microsoft.resources/subscriptions'
| project subscriptionId, name, properties.state
```

That tells you which subscriptions the collector *can* see. To learn which ones exist, you need a source with broader visibility: the management group hierarchy (if the collector can read the root), a list from your cloud platform team, or your billing records. The difference between "subscriptions that exist" and "subscriptions we read" is your first and most important gap. If the collector can't enumerate the full hierarchy, that list is a human assertion (Chapter 2) and should be recorded with its owner and date.

---

## 3.4 Microsoft Graph

Microsoft Graph provides the identity half of the evidence: who exists, how they're grouped, and which external systems are trusted to sign in as which application.

### Applications versus service principals

One distinction causes more confusion than any other when joining identity data to authorization data:

- An **application object** (app registration) is the definition of an app. Federated identity credentials live here.
- A **service principal** is that app's identity within a tenant. Role assignments point here: the `principalId` on an Azure role assignment is the service principal's object ID.

The two are linked by the application's **appId** (also called client ID), which both objects carry. To connect hop 1 (federated credential on the application) to hop 3 (role assignment to the service principal), you join through `appId`:

```text
application (federated credentials)
   │ appId
   ▼
service principal (object id)
   │ principalId
   ▼
role assignment (Azure RBAC)
```

Get this join wrong, for example by matching the application's object ID to a role assignment's `principalId`, and every CI/CD identity path disappears. Nothing errors. You just find nothing.

### Collecting federated identity credentials

With the Microsoft Graph PowerShell SDK:

```powershell
Connect-MgGraph -Identity

$applications = Get-MgApplication -All -Property 'id,appId,displayName'

$federated = foreach ($app in $applications) {
    Get-MgApplicationFederatedIdentityCredential -ApplicationId $app.Id |
        ForEach-Object {
            [pscustomobject]@{
                appId       = $app.AppId
                displayName = $app.DisplayName
                issuer      = $_.Issuer
                subject     = $_.Subject
                audiences   = $_.Audiences -join ','
            }
        }
}
```

For GitHub Actions, the `issuer` is GitHub's token service and the `subject` encodes what's trusted, such as a repository and branch (`repo:contoso/payments:ref:refs/heads/main`) or an environment. Record the subject exactly as stored. Chapter 4 covers how to interpret subjects, including the broader patterns that trust far more than one branch.

> **As of 2026-10:** Verify the current GitHub OIDC issuer URL and subject formats, including environment- and pull-request-based subjects.

Calling Graph once per application is slow in large tenants. Batching requests, or filtering to applications that have service principals with Azure role assignments, cuts the time considerably. Get it correct first, then make it fast.

### Nested group membership

Azure role assignments are often made to groups, and groups contain groups. To know who effectively holds a role, you need **transitive** membership, not just direct members. Graph exposes this directly (the `transitiveMembers` relationship on a group), which is far safer than writing your own recursive walk.

Collect it as observed data with its source, then let your derivation step compute effective access. If you later find a bug in how you handle nesting, you can re-derive from the same snapshot without collecting again.

---

## 3.5 Snapshots you can trust later

A collection is only useful as evidence if you can say exactly what it contains, when it was taken, and that it hasn't changed since. Package each collection as a **snapshot**: a set of data files plus a manifest that describes them.

### The manifest

```json
{
  "snapshotId": "2026-10-06T09-10-00Z-prod",
  "collectedAtUtc": "2026-10-06T09:10:00Z",
  "completedAtUtc": "2026-10-06T09:16:42Z",
  "collector": {
    "identity": "mi-security-collector",
    "azureRole": "Reader at tenant root management group",
    "graphPermissions": [
      "Application.Read.All",
      "GroupMember.Read.All",
      "User.Read.All",
      "RoleManagement.Read.Directory"
    ],
    "scriptVersion": "1.4.0"
  },
  "scope": {
    "tenantId": "00000000-0000-0000-0000-000000000000",
    "subscriptionsExpected": 11,
    "subscriptionsRead": 9,
    "expectedSource": "Human assertion: cloud platform team list, 2026-10-01"
  },
  "files": [
    { "name": "storage-accounts.json", "sha256": "…", "rows": 214, "query": "queries/storage-accounts.kql" },
    { "name": "role-assignments.json", "sha256": "…", "rows": 3920, "query": "queries/role-assignments.kql" },
    { "name": "federated-credentials.json", "sha256": "…", "rows": 37, "query": "graph:applications/federatedIdentityCredentials" }
  ],
  "gaps": [
    { "kind": "scopeNotReadable", "target": "subscription sub-payments-prod", "detail": "Not visible to collector; present in expected list" },
    { "kind": "scopeNotReadable", "target": "subscription sub-legacy-03", "detail": "Not visible to collector; present in expected list" }
  ]
}
```

Each field earns its place:

- **Start and end times.** Azure changes during a collection. A snapshot that took seven minutes isn't an instant, and hops collected minutes apart can disagree. Recording both times makes that visible.
- **Collector identity and permissions.** Results depend on what the collector could see. Record it so a later reader knows.
- **Expected versus read scope**, with the source of the expected number. This is the opening story's missing line.
- **A hash for every file.** If anyone or anything changes the data later, the hash won't match. That includes a well-meaning script that "fixes up" a value.
- **The query or API call behind each file.** You can't evaluate data without knowing how it was obtained.
- **Gaps** (section 3.7).

### Store snapshots so they can't be quietly edited

A hash detects change only if the manifest itself is safe. Store snapshots somewhere that resists modification, such as a storage account container with an immutability policy. That turns "we didn't change it" into something an auditor can check rather than take on trust. Keep the collector's write access limited to *adding* snapshots. It should never need to modify or delete old ones.

### One snapshot, many derivations

Treat snapshots as the raw observations and keep derivation (effective permissions, paths, rankings) as a separate step that reads them. That separation pays off repeatedly:

- When you fix a bug in path logic, you re-run it on last month's snapshot and see what changes.
- When someone challenges a path, you show exactly which snapshot files it came from.
- When you compare two points in time (Chapter 10), you compare snapshots, not your memory of what the environment looked like.

---

## 3.6 Never collect secret values

A security evidence store is a tempting place to put everything: connection strings found in app settings, storage keys "to test whether they work", tokens from pipeline variables. Don't.

The reasons are practical:

1. **It turns the evidence store into a higher-value target.** A snapshot that contains keys is immediately exploitable. One that contains only configuration has lower impact, but its inventory, network topology, identities, and privilege relationships are still valuable reconnaissance and must remain protected.
2. **It doesn't help the analysis.** To show that a path exists, you need to know that a key-based route is *possible*: shared key access enabled, and an identity that can list keys. You never need the key itself.
3. **It breaks the read-only guarantee.** Listing keys or reading secret values requires permissions beyond Reader. Granting them makes the collector a path to every secret in scope.

Record that a secret-bearing setting **exists**, and what kind it is. Don't record the value. For example, "App Service `pay-api` has an application setting whose name suggests a storage connection string" is useful evidence. Its value isn't. Even setting names can be sensitive in some organizations, so decide deliberately whether to keep them, and treat that as a governance choice (Chapter 11), not a default.

---

## 3.7 Gaps are results

Every collection has gaps. Reporting them isn't an admission of failure. Hiding them is.

### Kinds of gaps

| Kind | Example | What it means for paths |
|------|---------|--------------------------|
| **Scope not readable** | Two subscriptions not visible to the collector | Any path through those subscriptions is unknown |
| **API not permitted** | Graph returns 403 for directory role assignments | Directory-role paths are unknown |
| **Partial result** | ARG throttled the role-assignment query on page 3 | Some assignments are missing; any "no path" conclusion is unsafe |
| **Not collected by design** | Activity logs out of scope | You can describe capability, not use |
| **Stale** | Network data from yesterday's run, identity from today's | Hops may disagree in time |

### Record them where the results are

The worst place for a gap is a log file. Gaps belong in the manifest and in every report built from the snapshot. A path report should say, next to its findings, something like:

> Collected 9 of 11 expected production subscriptions. Paths that pass through `sub-payments-prod` or `sub-legacy-03` cannot be evaluated. Directory role assignments were collected. Network data is from the same run.

That paragraph would have turned the opening story's clean report into an obviously incomplete one, and sent someone to fix the collector's access before anyone relaxed.

### Gaps change conclusions

Chapter 2 introduced "insufficient evidence" as a state separate from "path exists" and "no path". Gaps are what produce it. A derivation step that reads a snapshot should check the gap list before saying "no path": if a required kind of evidence for that region of the estate is missing, the honest answer is "insufficient evidence", not "clean".

---

## 3.8 Freshness

Snapshots age. How often to collect depends on how fast your estate changes and what you're using the evidence for:

- **Path discovery and prioritization:** daily is usually enough. Most risky configurations persist for weeks.
- **Verifying a fix** (Chapter 10): collect on demand after the change, so the verification uses evidence newer than the fix.
- **Investigations:** use activity sources and change history, not just the latest snapshot.

Azure Resource Graph also exposes recent resource **change history**, which can tell you when a property changed between snapshots. It has limited retention, so treat it as a short-term supplement to snapshots, not a replacement.

> **As of 2026-10:** Verify the current retention and coverage of Resource Graph change history (`resourcechanges`).

Whatever cadence you choose, every derived result should carry the snapshot ID and time it was computed from. "The payments path exists" means little without "as of 2026-10-06 09:16 UTC".

---

## 3.9 Where AI fits in collection

Mostly, it doesn't, and that's deliberate.

Collection is where facts enter the system. Everything downstream (derivation, paths, rankings, explanations) inherits its trustworthiness from what was collected. If a model is involved in deciding what a role assignment says, every later conclusion depends on an AI inference, by Chapter 2's first rule.

There are two places where AI genuinely helps:

- **Drafting queries.** Models write reasonable KQL and Graph calls quickly, and they're good at remembering property paths you'd otherwise look up. Treat their output as a draft. Run it against a test subscription where you know the right answer before it goes anywhere near the collector. Watch for the specific traps in this chapter: absent properties treated as false, full role-definition IDs used for joins, missing paging, and application object IDs confused with service principal IDs. Models make all four mistakes regularly.
- **Explaining gaps.** Turning a manifest's gap list into a paragraph a manager can act on is a good use of a model, as long as it's working from the manifest and not filling in what the gaps might contain.

And one place it must never be used: **filling in missing data.** If a subscription couldn't be read, a model asked "what's probably in it?" will give a plausible answer. That answer is not evidence about your environment. It doesn't belong in the snapshot, and it must not be used to turn "insufficient evidence" into "no path".

---

## 3.10 Lab: collect the payments path

This lab builds a minimal collector and uses it to gather every observed fact in Chapter 2's hop table. It uses the companion lab tenant (Appendix A).

**Prerequisites.** A user-assigned managed identity (or a federated identity in your CI system) with Reader at the lab subscription or management group, and the four Microsoft Graph application permissions from section 3.2, admin-consented. The Az.ResourceGraph and Microsoft.Graph PowerShell modules.

**Step 1 — Collect with paging and gap capture.**

```powershell
Connect-AzAccount -Identity | Out-Null
Connect-MgGraph -Identity | Out-Null

$snapshotDir = Join-Path $PWD ("snapshot-{0:yyyy-MM-ddTHH-mm-ssZ}" -f (Get-Date).ToUniversalTime())
New-Item -ItemType Directory -Path $snapshotDir | Out-Null

$gaps = [System.Collections.Generic.List[object]]::new()

function Invoke-ArgQuery {
    param([string] $Name, [string] $Query)

    $rows = [System.Collections.Generic.List[object]]::new()
    $skipToken = $null

    try {
        do {
            # Search-AzGraph returns at most 1,000 rows per call; the skip token fetches the next page.
            $page = if ($skipToken) {
                Search-AzGraph -Query $Query -First 1000 -SkipToken $skipToken -UseTenantScope
            } else {
                Search-AzGraph -Query $Query -First 1000 -UseTenantScope
            }

            $rows.AddRange([object[]] $page.Data)
            $skipToken = $page.SkipToken
        } while ($skipToken)
    }
    catch {
        # A failed query is a gap, never an empty result.
        $gaps.Add([pscustomobject]@{ kind = 'partialResult'; target = $Name; detail = $_.Exception.Message })
    }

    ConvertTo-Json -InputObject ([object[]] $rows) -Depth 20 | Set-Content (Join-Path $snapshotDir "$Name.json")
}

Invoke-ArgQuery -Name 'storage-accounts' -Query (Get-Content queries/storage-accounts.kql -Raw)
Invoke-ArgQuery -Name 'role-assignments' -Query (Get-Content queries/role-assignments.kql -Raw)
Invoke-ArgQuery -Name 'subscriptions'    -Query (Get-Content queries/subscriptions.kql -Raw)
```

**Step 2 — Collect federated credentials and service principals** using the Graph snippet from section 3.4, plus `Get-MgServicePrincipal -All -Property 'id,appId,displayName'`. Write them to `federated-credentials.json` and `service-principals.json` in the snapshot directory.

**Step 3 — Compare expected and read scope.** Put the lab's expected subscription list in `expected-subscriptions.json` (this is a human assertion; record who wrote it and when). Add a `scopeNotReadable` gap for every expected subscription missing from `subscriptions.json`.

**Step 4 — Write the manifest.** Hash every file with `Get-FileHash -Algorithm SHA256` and write a `manifest.json` in the shape from section 3.5, including the gap list.

**Step 5 — Find the hops.** Using only the snapshot files (no live Azure calls), locate:

1. The federated credential whose subject is `repo:contoso/payments:ref:refs/heads/main`, and its `appId`.
2. The service principal with that `appId`, and its object ID.
3. The role assignment with that object ID as `principalId`, and confirm the role name and scope.
4. The storage account `custdata`, its resource group, and its shared key setting.

**Step 6 — Break it on purpose.** Remove the collector's Reader assignment from the payments resource group's subscription and run the collector again. Confirm that the manifest records the subscription as a gap, and that your Step 5 search now reports "insufficient evidence" for hops 3–5 rather than "not found".

**What you should see.** Steps 1–5 reproduce the observed facts from Chapter 2's hop table, each with a file, a query, and a timestamp. Step 6 reproduces the opening story, except that this time the result says it's blind.

---

## Summary

- List the evidence a path needs before writing queries: **identity, authorization, resources, network, and telemetry configuration**. Activity and secret values are different problems.
- The identity half (Microsoft Graph) and the authorization half (Azure Resource Graph) live in different APIs. Path collection needs both, joined correctly.
- Collect with a **dedicated, read-only, secretless identity**: Reader on Azure, narrow read-only Graph application permissions, managed identity or workload identity federation. Never as a person.
- Azure Resource Graph **silently omits scopes you can't read**. Compare expected to read scope every time.
- Watch the common traps: **absent properties** that mean "platform default", **role-definition joins** on full IDs, **missing pagination**, and **application versus service principal** IDs.
- Package each collection as a **snapshot**: files, hashes, queries, collector identity, scope, timing, and gaps, stored where it can't be quietly edited.
- **Never collect secret values.** Record that they exist and what kind they are.
- **Gaps are results.** Put them in the manifest and in every report. They are what make "insufficient evidence" possible.
- Use AI to **draft queries and explain gaps**, never to fill in missing data.

## Key terms

- **Collector** — the identity and code that reads evidence from Azure and Entra ID.
- **Snapshot** — a hashed, timestamped package of collected evidence plus a manifest describing it.
- **Manifest** — the snapshot's description: collector, scope, timing, file hashes, queries, and gaps.
- **Expected scope** — the subscriptions and directories that *should* be collected, from a source other than the collector itself.
- **Silent-scope problem** — a query returning results only from readable scopes, with no indication that others were skipped.
- **Application object / service principal** — an app's definition versus its identity in a tenant; joined by `appId`.
- **Transitive membership** — group membership including members of nested groups.

---

## Author notes (remove before submission)

- Verify: Reader excludes `listKeys` and App Service application-setting values; minimal Graph permission set names and coverage (especially `RoleManagement.Read.Directory` and PIM eligibility); `allowSharedKeyAccess` default; whether `authorizationresources` includes deny assignments and role assignment conditions; current GitHub OIDC issuer and subject formats; `resourcechanges` retention.
- Verify cmdlet details: `Search-AzGraph` `-First` maximum, `-SkipToken` and `-UseTenantScope` parameters, and the shape of its return object (`.Data`, `.SkipToken`) in the current Az.ResourceGraph version; `Get-MgApplicationFederatedIdentityCredential` parameter names.
- Decide whether PIM eligibility for Azure resources belongs here or in Chapter 4.
- The lab's query files (`queries/*.kql`) belong in the companion lab repo; keep them in sync with sections 3.3 and 3.10.
- Consider a figure: the application → service principal → role assignment join, with the wrong join (application object ID) shown crossed out.
- Add the Chapter 3 fact checks to GTM **M-306** when it is picked up.
