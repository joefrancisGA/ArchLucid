> **Scope:** Chapter 4 first draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft

# Chapter 4 — Identity and privilege paths

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: first draft. Target 9,000 words. Facts about Azure and Entra ID behavior must be re-verified against Microsoft documentation before submission.*

---

## The fix that didn't close the path

In this fictional scenario, Contoso's payments team acted on the path from Chapter 1. They changed the federated credential on `payments-deploy` so that it trusted only the `production` GitHub environment, which requires two approvals before a workflow can run. Merging to `main` was no longer enough to sign in as the deployment identity. They closed the ticket.

Two weeks later, a review of the identity graph found three more ways to reach the same storage account. None of them involved GitHub at all:

1. A senior developer was listed as an **owner** of the `payments-deploy` app registration. Owners can add credentials to the app. Any credential, including a client secret they choose, lets them sign in as `payments-deploy` and inherit its Contributor role.
2. Someone on the help desk held the Entra directory role **Cloud Application Administrator**. That role can add credentials to *any* app registration in the tenant, `payments-deploy` included.
3. A Function App in `rg-payments-prod` ran with a user-assigned managed identity that held **Storage Blob Data Reader** on a second account, `custarchive`, which held seven years of archived customer records. Contributor on the resource group means you can deploy code to that Function App, and code running in the Function App can use its managed identity.

The original fix was correct. It closed one entry point. But the deployment identity itself was the valuable thing, and there were several ways to become it. The team had fixed a *path*, and the *identity* was still exposed.

This chapter is about identity hops: the relationships that let one principal become, control, or act as another. In Azure they're the backbone of most serious paths, and they're the hops a list of role assignments is least able to show.

---

## 4.1 Why identity is the perimeter

In a traditional data center, network position decided a lot: if you were on the right VLAN, you could reach the database. In Azure, most control-plane and many data-plane operations go through Azure Resource Manager or service endpoints that anyone on the internet can reach, given a valid token. What decides whether a request succeeds is **who** the token says you are and what that identity is allowed to do.

That makes identity hops the most common, and usually the shortest, links in an Azure path. Network controls (Chapter 5) still matter a great deal, especially for data planes. But when you trace a real path from an entry point to something valuable, most of the hops are identity hops:

- *is a member of* a group,
- *holds a role at* a scope,
- *can sign in as* another identity,
- *can grant itself or others* more access,
- *controls a resource that runs as* an identity.

The sections below take these one at a time, then combine them into a graph you can search.

---

## 4.2 Effective access: from assignments to "can"

Chapter 3 collected role assignments: principal, role, scope. Turning those into "what can this identity actually do, where" is a derivation with several rules. Get any of them wrong and you'll either miss paths or invent them.

### Rule 1: Scopes inherit downward

Azure role assignments apply at the scope where they're made **and every scope below it**:

```text
tenant root management group
  └── management group
        └── subscription
              └── resource group
                    └── resource
```

Contributor at a subscription is Contributor on every resource group and resource in it. Reader at the root management group is Reader everywhere. This is why a handful of high-scope assignments often dominate an estate's identity graph. One assignment at the root can matter more than a thousand at resource scope.

### Rule 2: Groups expand transitively

An assignment to a group applies to every member, including members of nested groups. Chapter 3 collected transitive membership for exactly this reason. Effective access for a user is the union of their direct assignments and those of every group they're in, at any depth.

### Rule 3: Roles are sets of actions, in two planes

A role definition lists **Actions** (control plane: managing the resource) and **DataActions** (data plane: reading and writing what's inside it), with corresponding NotActions and NotDataActions that subtract from them.

This distinction is the key to many paths:

- **Contributor** has broad Actions (`*`), minus authorization writes and a few others, and **no DataActions**. A Contributor can't read blobs using their own Entra identity.
- **Storage Blob Data Reader** has a narrow DataAction to read blobs, and almost no Actions.
- But the Actions of Contributor include `Microsoft.Storage/storageAccounts/listKeys/action`. The storage account key bypasses Entra identity entirely and grants full data access, if shared key access is enabled.

So "Contributor can't read data" is true in the data-plane sense and false in practice, wherever a control-plane action produces a credential for the data plane. That conversion, from control-plane permission to data-plane access, is one of the most important hop types in Azure. Section 4.6 lists common examples.

### Rule 4: Subtract what's denied or conditioned

Two mechanisms can reduce effective access:

- **Deny assignments** block specific actions for specific principals at a scope, and override role assignments. You generally can't create them directly; Azure creates them for certain features, such as managed applications and deployment stacks with deny settings.
- **Conditions** on role assignments restrict when the role applies. The common case is storage data access limited by attributes such as container name or blob tags. Another important case is constraining which roles a delegated administrator can assign.

Most estates have few of either. But a derivation that ignores them will report paths that don't exist, and a reviewer who finds one such false path will stop trusting the rest. Check them, and record that you checked (Chapter 2, hop 6).

### Rule 5: Eligible is not active

With Privileged Identity Management (PIM), an assignment can be **eligible** rather than active: the principal can activate it, usually for a few hours, often after MFA, a justification, or an approval. An eligible assignment is a real hop, but a conditional one.

Represent eligible assignments as a distinct edge type, "can activate", carrying the activation requirements. A path through an eligible Owner assignment that requires approval from a separate team is meaningfully harder to use than one through an active assignment. It's still a path, and it belongs in the graph.

> **As of 2026-10:** Verify how PIM eligibility for Azure resource roles and Entra roles is exposed via ARM and Microsoft Graph, and which permissions are needed to read it.

### Effective access is a derived fact

Every rule above is deterministic and well-defined, which makes effective access a **derived fact** in Chapter 2's terms, as long as each rule is implemented correctly and the inputs are complete. Keep the inputs (which assignments, which memberships, which role definition) attached to every derived permission, so anyone can retrace it.

---

## 4.3 Becoming another identity

Effective access tells you what an identity can do. The more dangerous question is: **who can become this identity?** If many people can become `payments-deploy`, then `payments-deploy`'s permissions are effectively theirs.

Here are the common ways to become, or act as, a non-human identity in Azure and Entra ID.

### Federated identity credentials

A federated identity credential tells Entra ID to accept tokens from an external issuer, such as GitHub Actions, Azure DevOps, Kubernetes, or another cloud, for a specific **subject**. Anyone who can produce a token with that issuer and subject can sign in as the application.

The subject decides how wide the door is. For GitHub Actions, typical subjects look like this:

| Subject pattern | Who can produce the token |
|-----------------|---------------------------|
| `repo:contoso/payments:ref:refs/heads/main` | Any workflow run on `main`, so anyone who can get code merged there |
| `repo:contoso/payments:environment:production` | Workflows that target the `production` environment, subject to that environment's protection rules |
| `repo:contoso/payments:pull_request` | Workflows triggered by pull requests, so potentially anyone who can open one, depending on repository settings |
| `repo:contoso/payments:ref:refs/tags/*` pattern via flexible matching | Anyone who can push a matching tag |

Reading a subject is only half the job. The other half is outside Azure: who can merge to `main`, what the environment's protection rules require, whether pull requests from forks can request tokens. That evidence lives in GitHub, not Entra. You can collect it from GitHub's API, or record it as a human assertion with an owner and date. Either way, label it. Don't assume.

> **As of 2026-10:** Verify GitHub's current OIDC subject formats, subject customization options, fork pull request token behavior, and Entra ID support for wildcard or expression-based ("flexible") federated credential matching.

### Owners and credential management

App registrations and service principals have **owners**. An owner can manage the app's credentials, including adding a new client secret or certificate. A new credential lets the holder sign in as the app from anywhere.

That makes app ownership one of the most overlooked privilege hops. Owners are often added for convenience, such as the developer who created the app or the team lead who asked for it, and never removed. In the opening story, a developer's ownership of `payments-deploy` was a direct path to production Contributor.

Several Entra directory roles grant the same capability across many apps:

- **Application Administrator** and **Cloud Application Administrator** can manage credentials on application registrations and enterprise applications across the tenant.
- **Global Administrator** and **Privileged Role Administrator** can do this and much more.

> **As of 2026-10:** Verify the exact credential-management scope of Application Administrator and Cloud Application Administrator, including any restrictions on apps holding privileged roles.

### Managed identities and control of compute

A managed identity is an identity Azure attaches to a resource. Code running on that resource can obtain tokens for it from a local endpoint, with no credential to steal. That's excellent for removing secrets. It also means: **whoever controls the code running on the resource can act as its managed identity.**

Ways to control the code include:

- deploying a new version of a Function App, App Service, or container app,
- running a command on a virtual machine (VM run command, extensions),
- editing an Automation account runbook,
- changing a Logic App's workflow definition.

Many of these are ordinary control-plane actions included in Contributor and in service-specific contributor roles. So "Contributor on a resource group" often implies "can act as every managed identity attached to resources in that group".

There's one more twist for **user-assigned** managed identities. A user-assigned identity is a standalone resource that can be attached to many compute resources. Attaching one requires permission to assign the identity as well as write access to the compute resource. An identity that holds Contributor in a resource group containing both a VM and a user-assigned identity can usually attach the identity to the VM and then use it.

The opening story's third path was exactly this: Contributor on `rg-payments-prod`, deploy code to the Function App, act as its managed identity, and read `custarchive` with a data-plane role.

### Summary of "become" hops

| Hop | Requires | Evidence source |
|-----|----------|-----------------|
| Federated credential | Producing a token with the trusted issuer and subject | Graph (credential) + external system (who can produce it) |
| Add credential as owner | Ownership of the app or service principal | Graph (owners) |
| Add credential via directory role | Application Administrator, Cloud Application Administrator, or higher | Graph (directory role assignments) |
| Act as a managed identity | Control of code running on the attached resource | ARG (identity attachments) + effective access to the resource |
| Attach a user-assigned identity | Assign permission on the identity + write on the compute resource | ARG + effective access |

---

## 4.4 Granting more access

The third category of identity hop is **granting**: an identity that can change who holds what.

### Azure role assignment writers

Any identity with `Microsoft.Authorization/roleAssignments/write` at a scope can assign roles at that scope, including to itself. Built-in roles with this action include **Owner**, **User Access Administrator**, and **Role Based Access Control Administrator**. Contributor explicitly excludes it, which is why Contributor isn't automatically Owner.

Treat "can write role assignments at scope S" as "can obtain any role at scope S". In graph terms, that's an edge from the identity to every role at that scope. In practice, it's simplest to treat such identities as equivalent to Owner at that scope, unless a condition restricts which roles they can assign.

### Elevating from the directory to Azure

A **Global Administrator** in Entra ID can turn on a setting that grants them User Access Administrator at the root scope of Azure. That's one click from directory administrator to the ability to grant themselves anything in every subscription. Your identity graph needs an edge from Global Administrator to root-scope User Access Administrator, labeled as requiring that elevation step.

### Microsoft Graph application permissions as privilege

Service principals can hold Microsoft Graph **application permissions**, granted via admin consent. Some of these are effectively directory administration:

- permission to assign directory roles,
- permission to grant app role assignments (including Graph permissions) to any service principal, itself included,
- permission to manage all applications' credentials.

A service principal holding one of these is a privileged identity, even if it has no Azure roles at all. It belongs in the graph with "can grant" edges, and so does everyone who can become it (section 4.3).

> **As of 2026-10:** Verify which Microsoft Graph application permissions allow self-escalation (for example, role management and app role assignment write permissions) and their current names.

---

## 4.5 Building the identity graph

With the hop types defined, you can build a graph from a Chapter 3 snapshot.

### Nodes

| Node type | Examples |
|-----------|----------|
| **Principal** | User, group, service principal, managed identity |
| **Application** | App registration (holds federated credentials and owners) |
| **Scope** | Management group, subscription, resource group |
| **Resource** | Storage account, Function App, VM, key vault |
| **Capability** | "Read blob data in `custdata`", "Write role assignments at `rg-payments-prod`" |
| **Entry point** | "Workflow on `main` in `contoso/payments`", "Any guest user", "Internet" |

Capability nodes are worth the extra modeling. Targets are usually capabilities, such as reading this data or changing this deployment, not resources. Making them nodes lets one search answer "who can read customer data?" across many resources and routes.

### Edges

Every edge has a **type**, the **evidence** behind it, and its **evidence category** from Chapter 2:

| Edge type | From → To | Typical category |
|-----------|-----------|------------------|
| `memberOf` | Principal → Group | Observed fact |
| `appFor` | Application → Service principal | Observed fact (via `appId`) |
| `canSignInAs` | Entry point → Application | Deterministic inference (assumes the external system allows the token) |
| `ownerOf` / `canAddCredential` | Principal → Application | Observed fact / derived fact |
| `hasRoleAt` | Principal → Scope (with role) | Observed fact |
| `contains` | Scope → Scope or Resource | Observed fact |
| `canActivate` | Principal → Scope (eligible role) | Observed fact, with conditions |
| `canControlCode` | Principal → Compute resource | Derived fact (from effective actions) |
| `runsAs` | Compute resource → Managed identity | Observed fact |
| `grants` | Principal → Capability | Derived fact or deterministic inference |
| `canAssignRoles` | Principal → Scope | Derived fact |

### Search

Once the graph exists, path discovery is a graph search from entry points to target capabilities. Breadth-first search is enough to start, and it finds the shortest paths first, which are usually the most important.

Here is a minimal sketch in Python using only the standard library:

```python
from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    kind: str
    evidence: str   # "observed", "derived", "inference", "ai", "human"
    detail: str     # citation: snapshot file and row, or rule name


# Evidence-only edges are kept as citations for derived edges but never walked.
# Holding a role at a scope that contains a resource proves nothing by itself:
# Reader on a resource group can't deploy code or list keys.
EVIDENCE_ONLY_KINDS = {"hasRoleAt", "contains", "ownerOf", "canActivate"}


def find_paths(
    edges: list[Edge],
    entry: str,
    target: str,
    max_hops: int = 8,
) -> list[list[Edge]]:
    """Return every simple path from entry to target, shortest first."""
    outgoing: dict[str, list[Edge]] = {}

    for edge in edges:
        if edge.kind not in EVIDENCE_ONLY_KINDS:
            outgoing.setdefault(edge.source, []).append(edge)

    paths: list[list[Edge]] = []
    queue: deque[tuple[str, list[Edge]]] = deque([(entry, [])])

    while queue:
        node, path = queue.popleft()

        if node == target and path:
            paths.append(path)
            continue

        if len(path) >= max_hops:
            continue

        # Avoid revisiting nodes already on this path, so cycles in group nesting can't loop forever.
        visited = {entry} | {edge.target for edge in path}

        for edge in outgoing.get(node, []):
            if edge.target not in visited:
                queue.append((edge.target, path + [edge]))

    return paths
```

This is deliberately naive. Real estates need pruning: cap path length, collapse equivalent routes, and precompute "who has Owner-equivalent access at each scope" rather than expanding every role assignment. Specialized graph databases and libraries help at scale. But this version is enough to find the payments paths in the lab tenant, and it's short enough to read and trust.

The search walks only edges that mean "can". A role assignment and the scopes beneath it are evidence for a capability, not the capability itself. The loader evaluates the role's effective actions against each resource under the scope and emits a `canControlCode` or `grants` edge only when the actions actually allow it. Those derived edges cite the `hasRoleAt` and `contains` evidence they came from. Skip that step and every role assignment, even Reader, looks like a path to the data.

Note that every edge carries its evidence and a citation. When the search returns a path, you already have Chapter 2's hop table: each step, its category, and where it came from.

### The payments graph

Here's the identity graph around `payments-deploy` after the opening story's discovery:

```text
[Entry] workflow on production environment ──canSignInAs──┐
                                                          │
user: dev-lead ──────────ownerOf / canAddCredential────────┤
                                                          ▼
role: Cloud Application Administrator ──canAddCredential──▶ app: payments-deploy
   ▲                                                      │ appFor
   │ hasRole (directory)                                  ▼
user: helpdesk-07                              sp: payments-deploy
                                                          │ hasRoleAt: Contributor
                                                          ▼
                                              scope: rg-payments-prod
                                     contains │                      │ contains
                                              ▼                      ▼
                                   storage: custdata       func: pay-reconcile
                                 grants (listKeys,                   │ runsAs
                                  shared key enabled)                ▼
                                              │              mi: mi-pay-reconcile
                                              ▼                      │ hasRoleAt: Storage Blob Data Reader
                              [Target] read customer data            ▼
                                                           storage: custarchive
                                                                     │ grants
                                                                     ▼
                                                   [Target] read archived customer data
```

The diagram draws role assignments, scope containment and the directory role as separate hops so you can read them. In the searchable graph, the loader collapses each of those chains into a derived edge (lab Step 2): `payments-deploy` gets `canControlCode` on `pay-reconcile` and `grants` on reading `custdata`, `mi-pay-reconcile` gets `grants` on reading `custarchive`, and `helpdesk-07` gets `canAddCredential` on the app.

Three entry points reach `payments-deploy`: the GitHub workflow, the app owner, and the help-desk user's directory role. From it, two routes lead to two customer data stores. That's six paths. Fixing the GitHub entry point narrowed one arrow at the top. Every other route stayed.

---

## 4.6 Control plane to data plane

Section 4.2 introduced the most important conversion in Azure paths: a control-plane permission that yields data-plane access. These are worth listing explicitly, because they're where "Contributor can't read data" turns out to be false.

| Control-plane capability | Data-plane result | Condition |
|--------------------------|-------------------|-----------|
| List storage account keys | Full access to blobs, files, queues, tables | Shared key access enabled |
| Generate an account SAS (requires keys) | Scoped data access, often long-lived | Shared key access enabled |
| Modify a key vault's access policies | Grant yourself secret, key, or certificate access | Vault uses the access-policy permission model rather than Azure RBAC |
| Deploy code to compute with a managed identity | Whatever the managed identity can access | Identity attached |
| Read a resource's connection strings or app settings (list action) | Credentials for other systems | Secrets stored in settings rather than Key Vault references |
| Change a database server's Entra administrator | Administrative access to the database | Entra authentication enabled |
| Reset a VM's local administrator password | Interactive access to the VM and its managed identity | VM access extension available |

Each row becomes a `grants` edge in the graph with its condition attached. Most are deterministic inferences: the conversion is real if the condition holds, and the condition is usually something your snapshot can check.

The first and third rows of that table explain why Microsoft has spent years pushing customers toward Azure RBAC for Key Vault and toward disabling shared key access on storage. Both changes remove control-to-data conversions, so a control-plane role stays a control-plane role.

> **As of 2026-10:** Verify each conversion against current service documentation and built-in role definitions.

---

## 4.7 Directory roles and Azure roles are different systems

Entra ID **directory roles** (Global Administrator, Application Administrator, User Administrator, and so on) and Azure **resource roles** (Owner, Contributor, Reader, and so on) are separate authorization systems:

- Directory roles govern Entra objects: users, groups, applications, policies.
- Azure roles govern Azure resources through Azure Resource Manager.
- A Global Administrator has no Azure resource access by default, and a subscription Owner has no directory privileges by default.

They connect through a few specific bridges, and your graph needs each one:

- **Elevation:** Global Administrator can grant themselves User Access Administrator at the Azure root (section 4.4).
- **Credential management:** directory roles that can add credentials to applications can become any service principal that holds Azure roles (section 4.3).
- **Group management:** directory roles or group owners that can change membership of a group used in Azure role assignments can add themselves to it. Watch especially for groups that aren't role-assignable, which don't get the extra protections role-assignable groups have.
- **User management:** roles that can reset passwords or authentication methods for other users can take over those users, and everything they hold.

The last two bridges mean the graph needs edges like "can modify membership of" and "can reset credentials of". Those come from directory role assignments and group ownership in Microsoft Graph. Chapter 3's permission set already covers them, and this chapter's lab adds them to the collector.

---

## 4.8 Keeping the graph useful

A complete identity graph for a large tenant has millions of edges. Most of it is noise. Some practical rules keep it usable:

- **Start from targets, not from everything.** Define a short list of target capabilities (Chapter 1, section 1.7) and search backward from them. You don't need every path in the tenant, just the ones that end somewhere that matters.
- **Collapse Owner-equivalence.** Precompute, for each scope, the set of identities that are Owner-equivalent: Owner, User Access Administrator, RBAC Administrator, or anyone who can become one. Use that set as a single node rather than expanding every assignment.
- **Treat high-scope roles as a finding in themselves.** If 40 identities hold Contributor at the root management group, every target is a few hops from 40 entry points. That's not 4,000 paths to report; it's one structural problem to report.
- **Label break-glass accounts** as human assertions with owners and expiry ("emergency access account; sign-ins alerted to SOC"). Don't hide them. Make their monitoring explicit.
- **Record what's outside Azure.** GitHub branch protection, Azure DevOps permissions, and HR processes for joiners and leavers are part of many paths. If you don't collect them, mark the edge as an assumption.

---

## 4.9 Where AI fits

Identity paths are where AI explanation shines and AI reasoning fails most visibly.

**Explanation works well.** A ten-hop identity path written as a hop table is hard for most readers to follow. A model given that table, with citations, can produce something like:

> A developer who owns the `payments-deploy` app registration can add a password to it [hop 2]. That password lets them sign in as the payments deployment identity [hop 3], which can manage everything in the production payments resource group [hop 4]. That includes deploying code to the reconciliation Function App [hop 6], which runs as an identity that can read the customer archive [hops 7–8].

That's genuinely useful, and Chapter 7 shows how to keep it grounded.

**Reasoning about roles fails.** Ask a model "can Contributor read blob data?" and you'll often get a confident answer that's either too simple ("no") or wrong in the details. Ask it what a custom role named `Payments Operator` can do, and it will guess from the name. Models don't know your custom roles, and their knowledge of built-in roles is frozen at their training date, while role definitions change.

So: **never let a model decide what a role permits.** Look it up in the role definitions you collected (this chapter's lab), compute effective actions deterministically, and give the model the result to explain.

**Graph search fails.** Ask a model to "find all the ways to reach `custdata`" from a large dump of role assignments and memberships, and it will find some, miss others, and occasionally invent an edge, such as a membership that doesn't exist or a role at the wrong scope. Graph search is exactly the exhaustive, repeatable work that deterministic code does well and models don't.

---

## 4.10 Lab: the identity graph for the payments estate

This lab builds the identity graph from the snapshot you collected in Chapter 3's lab and finds every path from three entry points to two customer data targets.

**Setup.** The companion lab tenant (Appendix A) includes the opening story's configuration: an owner on `payments-deploy`, a user with Cloud Application Administrator, and a Function App with a user-assigned managed identity that holds Storage Blob Data Reader on `custarchive`.

**Step 1 — Extend the collector.** Chapter 3's collector gathered storage accounts, role assignments, subscriptions, federated credentials and service principals. Identity paths need five more inputs: role definitions, managed identity attachments, app owners, directory role assignments, and transitive members of the groups that hold roles. Chapter 3's Reader assignment and Graph permissions already cover all five. Add these lines to the collector, reusing its `Invoke-ArgQuery` function and `$snapshotDir`:

```powershell
Invoke-ArgQuery -Name 'role-definitions' -Query @'
authorizationresources
| where type =~ 'microsoft.authorization/roledefinitions'
| project id, roleName = tostring(properties.roleName), permissions = properties.permissions
'@

Invoke-ArgQuery -Name 'identity-attachments' -Query @'
resources
| where isnotnull(identity)
| project id, type, resourceGroup, subscriptionId,
    identityType = tostring(identity.type),
    systemPrincipalId = tostring(identity.principalId),
    userAssigned = identity.userAssignedIdentities
'@

function Save-Snapshot {
    param([string] $Name, [object[]] $Rows)

    ConvertTo-Json -InputObject $Rows -Depth 10 | Set-Content (Join-Path $snapshotDir "$Name.json")
}

$apps = Get-MgApplication -All -Property 'id,appId,displayName'

# Owners are a per-application call. Large tenants should batch these requests.
$appOwners = foreach ($app in $apps) {
    foreach ($owner in Get-MgApplicationOwner -ApplicationId $app.Id -All) {
        [pscustomobject]@{ appObjectId = $app.Id; appId = $app.AppId; ownerId = $owner.Id }
    }
}
Save-Snapshot 'app-owners' $appOwners

Save-Snapshot 'directory-role-definitions' (Get-MgRoleManagementDirectoryRoleDefinition -All |
    Select-Object Id, DisplayName)
Save-Snapshot 'directory-role-assignments' (Get-MgRoleManagementDirectoryRoleAssignment -All |
    Select-Object PrincipalId, RoleDefinitionId, DirectoryScopeId)

# Expand only groups that actually hold an Azure role, not every group in the tenant.
$roleGroups = (Get-Content (Join-Path $snapshotDir 'role-assignments.json') -Raw | ConvertFrom-Json) |
    Where-Object principalType -eq 'Group' |
    Select-Object -ExpandProperty principalId -Unique

$groupMembers = foreach ($groupId in $roleGroups) {
    foreach ($member in Get-MgGroupTransitiveMember -GroupId $groupId -All) {
        [pscustomobject]@{ groupId = $groupId; memberId = $member.Id }
    }
}
Save-Snapshot 'group-transitive-members' $groupMembers
```

Wrap the Graph calls in `try`/`catch` the same way `Invoke-ArgQuery` does, so a throttled or forbidden call becomes a gap rather than an empty file. Then rewrite the manifest (Chapter 3, Step 4) so the new files are hashed.

**Step 2 — Build edges.** Write a loader that reads the snapshot files and emits `Edge` records (section 4.5). Some edges come straight from a row:

1. transitive group memberships (`memberOf`),
2. federated credentials (`canSignInAs`) from an entry-point node named after the subject,
3. app owners (`ownerOf` as evidence, plus `canAddCredential`),
4. holders of directory roles that manage application credentials (`canAddCredential` to every application in the role's directory scope),
5. `appFor` links joined through `appId`,
6. role assignments (`hasRoleAt`) and scope containment (`contains`), as evidence only,
7. managed identity attachments (`runsAs`).

The rest are derived. For every role assignment, find the role definition (join on `roleName`; custom role names are unique within a tenant), then evaluate it against each resource under the assignment's scope:

```python
from fnmatch import fnmatchcase


def matches(patterns: list[str], action: str) -> bool:
    # Azure action strings are case-insensitive, and "*" may span "/" segments.
    return any(fnmatchcase(action.lower(), pattern.lower()) for pattern in patterns)


def role_permits(role: dict, action: str, data_plane: bool = False) -> bool:
    """True if any permission block allows the action without excluding it."""
    allow_key, exclude_key = ("dataActions", "notDataActions") if data_plane else ("actions", "notActions")

    return any(
        matches(block.get(allow_key) or [], action) and not matches(block.get(exclude_key) or [], action)
        for block in role["permissions"]
    )
```

Emit a derived edge only when the role permits the specific action that matters:

- `grants` read on a storage account's data when the role permits `Microsoft.Storage/storageAccounts/listKeys/action` and the account allows shared key access, or permits the data action `Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read`.
- `canControlCode` on a Function App or web app when the role permits the write actions your lab's deployment-actions table lists for that resource type, starting with `Microsoft.Web/sites/write`.
- Any other control-to-data conversion from section 4.6, checking its condition against the snapshot.

Each derived edge cites the `hasRoleAt` row, the `contains` chain and the role definition it came from. With Contributor on `rg-payments-prod`, `payments-deploy` gets both derived edges. With Reader at the same scope, it gets neither, because `*/read` matches neither the list-keys action nor the write actions.

Two cases need care. If a role assignment has a `condition`, label the derived edge as a deterministic inference and copy the condition into its detail; don't silently treat it as unconditional. If you haven't collected deny assignments at a scope, record that as a gap on every derived edge under it, because a deny assignment there would remove the capability.

**Step 3 — Search.** Run `find_paths` from each entry point to each target capability. List the paths shortest first, and print each one as a hop table with evidence categories.

**Step 4 — Check against the opening story.** The lab starts with the original `main` branch subject in place. Confirm that you find all three entry points into `payments-deploy` (the `main` workflow, the app owner, and the help-desk user) and both routes out of it, for six paths in total. If you find fewer, find out which edge your loader missed. The most common culprits are the `appId` join, transitive membership, and a role definition that didn't join. If you find more, check whether a `grants` or `canControlCode` edge came from a role that doesn't actually permit the action.

**Step 5 — Apply the original fix.** Change the federated credential to the `production` environment subject in the lab, re-collect, and search again. Confirm that the `main` entry point is replaced by the narrower production-environment entry, and that the four paths through the app owner and the help-desk user are unchanged.

**Step 6 — Find a better fix.** Look at the graph and answer: which single change removes the most paths? Candidates include removing the developer's app ownership, removing the directory role, narrowing `payments-deploy` from Contributor, and disabling shared key access. Write down your answer. Chapter 9 returns to this question formally as cut-point analysis.

**What you should see.** The original fix narrows only the two paths that start from the GitHub workflow. Narrowing `payments-deploy`'s role closes all six at once, because the deployment identity is where the paths converge. That convergence is the lesson of this chapter: protect the identities that many paths pass through, not just the doors in front of them.

---

## Summary

- In Azure, **identity is the perimeter**. Most serious paths are chains of identity hops: membership, role, become, grant, control.
- Effective access is a **derived fact** built from five rules: scopes inherit downward, groups expand transitively, roles have **control-plane and data-plane** actions, deny assignments and conditions subtract, and **eligible is not active**.
- The most dangerous question is **who can become an identity**: federated credential subjects, app **owners**, directory roles that manage credentials, and **control of code** running with a managed identity.
- Identities that can **write role assignments**, Global Administrators who can **elevate**, and service principals with privileged **Graph application permissions** can grant themselves more.
- **Control-to-data conversions** (list keys, access policies, code deployment, credential reads) are why "Contributor can't read data" is often false.
- Directory roles and Azure roles are **separate systems** connected by specific bridges. Model each bridge.
- Build a graph with typed, cited, evidence-labeled edges, and **search backward from targets**.
- Use AI to **explain** identity paths. Never let it decide what a role permits or search the graph for you.

## Key terms

- **Effective access** — what an identity can do at a scope after inheritance, group expansion, role contents, denies, and conditions.
- **Control plane / data plane** — managing a resource versus reading or writing what's inside it.
- **Control-to-data conversion** — a control-plane action that yields data-plane access (for example, listing storage keys).
- **Federated identity credential** — trust in an external issuer's tokens for a specific subject.
- **Subject** — the claim in an external token that identifies what is trusted (repository, branch, environment).
- **Owner (application)** — a principal that can manage an app registration's credentials.
- **Managed identity** — an identity attached to an Azure resource; code on that resource can use it.
- **Eligible assignment** — a PIM role that must be activated before use.
- **Owner-equivalent** — any identity that can obtain Owner at a scope, directly or by granting itself roles.
- **Capability node** — a graph node representing an action that matters, such as reading specific data.

---

## Author notes (remove before submission)

- Verify: Contributor's NotActions and absence of DataActions; built-in roles with `roleAssignments/write`; deny assignment creation sources (managed apps, deployment stacks); role assignment conditions for storage and for constrained delegation; PIM eligibility APIs and read permissions.
- Verify: credential-management scope of Application Administrator and Cloud Application Administrator; Global Administrator elevation to root User Access Administrator; Graph application permissions that allow self-escalation (current names).
- Verify: GitHub OIDC subject formats and customization; fork pull request token behavior; Entra flexible federated identity credential support and syntax.
- Verify each control-to-data conversion in section 4.6, especially Key Vault access-policy modification, VM password reset, and database Entra administrator change.
- Verify: managed identity attach permissions (assign action on user-assigned identity) and which built-in roles include code deployment for Functions, App Service, Automation, and Logic Apps.
- Verify lab Step 1: `authorizationresources` includes role definitions with `properties.permissions`; `resources.identity.userAssignedIdentities` carries `principalId`; cmdlet names and property casing for `Get-MgApplicationOwner`, `Get-MgRoleManagementDirectoryRoleAssignment`, `Get-MgRoleManagementDirectoryRoleDefinition`, `Get-MgGroupTransitiveMember`; Graph permissions in section 3.2 suffice for all of them.
- Verify lab Step 2: the minimal action set that allows code deployment to Functions and App Service (`Microsoft.Web/sites/write`, publishing credentials, `config/write`); custom role name uniqueness within a tenant; how deny assignments are collected (ARG vs `Get-AzDenyAssignment`).
- Consider a figure for section 4.5's payments graph instead of ASCII.
- Add the Chapter 4 fact checks to GTM **M-306** when it is picked up.
