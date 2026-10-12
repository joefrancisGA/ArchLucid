> **Scope:** Chapter 4 revised draft for the book draft *Managing Azure Security with AI*. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft — revised (revision pass 1, 2026-10-10)

# Chapter 4 — Identity and privilege paths

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: revised (revision pass 1, 2026-10-10). Target 9,000 words. Facts about Azure and Entra ID behavior were checked against Microsoft documentation in October 2026; dated "As of" notes mark the ones to re-check before submission.*

---

## The fix that didn't close the path

In this fictional scenario, Contoso's payments team acted on the path from Chapter 1. They changed the federated credential on `payments-deploy` so that it trusted only the `production` GitHub environment, which requires approval from a designated reviewer before a deployment job can run. Merging to `main` was no longer enough to sign in as the deployment identity. They closed the ticket.

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

An assignment to a group applies to every member, including members of nested groups. Collect transitive membership for exactly this reason: Chapter 3 explains why direct members are not enough, and this chapter's lab writes the file. Effective access for a user is the union of their direct assignments and those of every group they're in, at any depth.

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

The opposite mistake is quieter. A condition is an expression over attributes, such as container names, blob tags, or request properties, and a snapshot of role assignments usually can't evaluate it. A derivation that drops every conditioned assignment it can't evaluate doesn't report a false path. It hides one that might be real, and nobody notices the gap. Section 4.5 keeps those hops and labels them instead.

### Rule 5: Eligible is not active

With Privileged Identity Management (PIM), an assignment can be **eligible** rather than active: the principal can activate it, usually for a few hours, often after MFA, a justification, or an approval. An eligible assignment is a real hop, but a conditional one.

Represent eligible assignments as a distinct edge type, "can activate", carrying the activation requirements. A path through an eligible Owner assignment that requires approval from a separate team is meaningfully harder to use than one through an active assignment. It's still a path, and it belongs in the graph.

The two kinds of eligibility live in different places. Eligibility for Azure resource roles is an ARM resource, `Microsoft.Authorization/roleEligibilitySchedules`, readable at the scope it applies to. Eligibility for Entra directory roles is in Microsoft Graph, under `roleManagement/directory/roleEligibilitySchedules`, and reading it needs a Graph permission such as `RoleEligibilitySchedule.Read.Directory`. A collector that reads only one of them will miss half the "can activate" edges.

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

By default, workflows triggered by pull requests from forks don't receive an OIDC token, so the `pull_request` row is usually limited to branches in the repository itself. Check whether anyone has changed that default. Entra's flexible federated credentials, still in preview, match subjects with a `claimsMatchingExpression` instead of an exact string. Read the expression the way you'd read a firewall rule: work out the widest set of subjects it accepts.

> **As of 2026-10:** GitHub subject formats change. Repositories created after July 15, 2026, repositories renamed or transferred after that date, and existing repositories that opt in use immutable subjects containing owner and repository IDs (`repo:owner@id/repo@id:…`), so a federated credential written for the old format won't match them. Re-check the formats and the flexible credential syntax before you rely on them.

### Owners and credential management

App registrations and service principals have **owners**. An owner can manage the app's credentials, including adding a new client secret or certificate. A new credential lets the holder sign in as the app from anywhere.

That makes app ownership one of the most overlooked privilege hops. Owners are often added for convenience, such as the developer who created the app or the team lead who asked for it, and never removed. In the opening story, a developer's ownership of `payments-deploy` was a direct path to production Contributor.

Several Entra directory roles grant the same capability across many apps:

- **Application Administrator** and **Cloud Application Administrator** can manage credentials on application registrations and enterprise applications across the tenant.
- **Global Administrator** can do this and much more.
- **Privileged Role Administrator** doesn't manage credentials directly, but it can assign itself any directory role, including the ones above. That's a granting hop (section 4.4), not a "become" hop.

Microsoft's own role documentation warns about the consequence: a holder of Application Administrator can add a credential to an app and then do anything that app's identity can do. The role doesn't exclude apps that hold privileged permissions, so treat these roles as able to become every application in their scope.

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
| Add credential via directory role | Application Administrator, Cloud Application Administrator, or Global Administrator | Graph (directory role assignments) |
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

- permission to assign directory roles (`RoleManagement.ReadWrite.Directory`),
- permission to grant app role assignments, including Graph permissions, to any service principal, itself included (`AppRoleAssignment.ReadWrite.All`),
- permission to manage all applications' credentials (`Application.ReadWrite.All`).

A service principal holding one of these is a privileged identity, even if it has no Azure roles at all. It belongs in the graph with "can grant" edges, and so does everyone who can become it (section 4.3).

---

## 4.5 Building the identity graph

With the hop types defined, you can build a graph from a Chapter 3 snapshot plus the files this chapter's lab adds: application owners, directory role assignments, transitive memberships, role definition actions, deny assignments, scope parents, and compute identity attachments. The Chapter 3 lab does not write those files.

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
| `hasRoleAt` | Principal → Scope (with role) | Observed fact; derivation input, not a search hop |
| `contains` | Scope → Scope or Resource | Observed fact; derivation input, not a search hop |
| `canActivate` | Principal → Scope (eligible role) | Observed fact, with conditions |
| `canControlCode` | Principal → Compute resource | Derived fact (from effective actions) |
| `runsAs` | Compute resource → Managed identity | Observed fact |
| `grants` | Principal → Capability | Derived fact or deterministic inference |
| `canAssignRoles` | Principal → Scope | Derived fact |
| `canReach` | Network position → Endpoint | Deterministic inference from network configuration (Chapter 5); an indeterminate hop carries an unmodeled control |

### From assignments to edges

Search must not walk raw role assignments or scope containment. `hasRoleAt` records that a principal was assigned a role at a scope. `contains` records that a scope is inside another scope. Neither one says what the role allows. Chaining them to `runsAs` or `grants` makes every assignment at that scope, including Reader, look able to deploy code or read data.

Derive `canControlCode` and `grants` first, using the five rules in section 4.2:

- inherit the assignment down the scope tree,
- copy group assignments onto transitive members,
- evaluate the role definition's Actions, NotActions, DataActions, and NotDataActions,
- subtract deny assignments, except for principals the deny excludes,
- keep what the derivation can't evaluate, and label it.

The last rule needs a reason. A role-assignment condition only narrows what the role allows. So the most the assignment could grant is the role without its condition, and the derivation draws edges at that upper bound. Each such edge carries an **unmodeled control**: the condition text, the assignment it came from, and its citation. Two other cases get the same treatment. A role whose definition wasn't collected is treated as allowing everything, and the edge says the definition is missing. A deny assignment with a condition might or might not block, so it labels the hop instead of removing it.

The label lives on the edge rather than in a separate list of caveats, so search carries it into every path that uses the hop. A path that uses even one labeled edge is reported with the assumption it rests on, and it never reads as confirmed. Where the same hop also exists without any control, the plain edge replaces the labeled one, because the hop holds either way.

Only the resulting privilege edges go into search. A Reader assignment produces neither `canControlCode` nor a list-keys `grants` edge, so it cannot reach the targets. Contributor can, because its Actions are `*` and its NotActions do not remove `Microsoft.Web/sites/write` or `Microsoft.Storage/storageAccounts/listKeys/action`.

The sketch below uses only the Python standard library. It is the loader's derivation, not a second authorization system inside the search.

<!-- listing: lab/listings/python/ch04_paths.py#identity_graph -->

```python
from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class UnmodeledControl:
    """A control the derivation found but can't evaluate, so it can't tell whether the hop holds."""
    # "roleCondition", "missingRoleDefinition", "denyWithCondition", "networkIndeterminate"
    kind: str
    principal: str
    scope: str
    role: str        # role name, or the deny assignment's name
    condition: str   # raw condition text; empty for a missing role definition
    citation: str

    def assumption(self) -> str:
        """The control as a checkable assumption for a hop table."""
        where = f"'{self.role}' at {self.scope} ({self.citation})"

        if self.kind == "missingRoleDefinition":
            return f"role {where} allows this hop; its definition wasn't collected"

        if self.kind == "networkIndeterminate":
            return f"{self.principal} may reach {self.scope} ({self.citation}): {self.condition}"

        return f"{self.kind} on {where} allows this hop: {self.condition}"


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    kind: str
    evidence: str   # "observed", "derived", "inference", "ai", "human"
    detail: str     # citation: snapshot file and row, or rule name
    control: UnmodeledControl | None = None   # set when the hop rests on an unevaluated control


# Kinds find_paths may walk. hasRoleAt and contains are deliberately absent.
PRIVILEGE_KINDS = frozenset({
    "memberOf",
    "appFor",
    "canSignInAs",
    "ownerOf",
    "canAddCredential",
    "canActivate",
    "canControlCode",
    "runsAs",
    "grants",
    "canAssignRoles",
    "canReach",
})

# Observed structure. Kept for citation and as derivation input. Not a capability.
STRUCTURAL_KINDS = frozenset({"hasRoleAt", "contains"})

# Representative actions for the payments lab. A wildcard such as
# Microsoft.Web/sites/* covers the first; Reader's */read covers neither.
CODE_CONTROL_ACTION = "Microsoft.Web/sites/write"
LIST_KEYS_ACTION = "Microsoft.Storage/storageAccounts/listKeys/action"
BLOB_READ_ACTION = "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read"
# Stand-in for a role whose definition wasn't collected: assume the most it could grant.
UNKNOWN_ROLE_PERMISSIONS = [{"actions": ["*"], "data_actions": ["*"]}]


def pattern_covers(patterns: list[str], action: str) -> bool:
    """Return whether any Azure RBAC wildcard pattern covers action.

    '*' matches any text, including the provider prefix. '*/read' therefore
    matches a read action and does not match listKeys/action.
    """
    action_folded = action.lower()

    for pattern in patterns:
        pattern_folded = pattern.lower()
        pieces = pattern_folded.split("*")

        if len(pieces) == 1:
            if pattern_folded == action_folded:
                return True

            continue

        if not action_folded.startswith(pieces[0]):
            continue

        cursor = len(pieces[0])
        matched = True

        for piece in pieces[1:-1]:
            found = action_folded.find(piece, cursor)

            if found < 0:
                matched = False
                break

            cursor = found + len(piece)

        if not matched:
            continue

        tail = pieces[-1]

        tail_fits = action_folded.endswith(tail) and cursor <= len(action_folded) - len(tail)

        if tail == "" or tail_fits:
            return True

    return False


def action_permitted(permissions: list[dict], action: str, plane: str) -> bool:
    """True when one permission block grants action on that plane and does not remove it.

    A role unions its permission blocks. NotActions apply only inside the block that lists them.
    plane is 'control' or 'data'.
    """
    grant_key = "actions" if plane == "control" else "data_actions"
    deny_key = "not_actions" if plane == "control" else "not_data_actions"

    for block in permissions:
        granted = pattern_covers(block.get(grant_key, []), action)
        removed = pattern_covers(block.get(deny_key, []), action)

        if granted and not removed:
            return True

    return False


def scope_key(scope: str) -> str:
    """Fold a scope id. Azure resource ids are case-insensitive."""
    return scope.lower()


def descendants_of(children_of: dict[str, list[str]], scope: str) -> list[str]:
    """Return child scopes, including nested ones. The start scope is not included."""
    ordered: list[str] = []
    pending: list[str] = list(children_of.get(scope, []))

    while pending:
        child = pending.pop()

        if child in ordered:
            continue

        ordered.append(child)
        pending.extend(children_of.get(child, []))

    return ordered


def expand_group_assignments(
    assignments: list[dict],
    members_of: dict[str, list[str]],
) -> list[dict]:
    """Copy each group assignment onto transitive members.

    members_of must already be transitive. Direct members hide nested groups.
    """
    expanded: list[dict] = list(assignments)

    for assignment in assignments:
        group_id = assignment["principal"]

        for member in members_of.get(group_id, []):
            copied = dict(assignment)
            copied["principal"] = member
            copied["citation"] = f"{assignment['citation']}; memberOf {group_id}"
            expanded.append(copied)

    return expanded


Grant = tuple[list[dict], str, UnmodeledControl | None]   # permissions, citation, control


def _granting(
    blocks: list[Grant], action: str, plane: str
) -> tuple[str, UnmodeledControl | None] | None:
    """(citation, control) of a grant for action, preferring one with no unmodeled control."""
    hits = [(citation, control) for permissions, citation, control in blocks
            if action_permitted(permissions, action, plane)]
    plain = [hit for hit in hits if hit[1] is None]

    return (plain or hits or [None])[0]


def _assignment_control(
    assignment: dict, role_definitions: dict[str, dict]
) -> UnmodeledControl | None:
    """The control that keeps this assignment from being evaluated, if any."""
    condition = (assignment.get("condition") or "").strip()

    if assignment["role_name"] not in role_definitions:
        kind = "missingRoleDefinition"
    elif condition:
        kind = "roleCondition"
    else:
        return None

    return UnmodeledControl(kind, assignment["principal"], assignment["scope"],
                            assignment["role_name"], condition, assignment["citation"])


def _folded_children(children_of: dict[str, list[str]]) -> dict[str, list[str]]:
    folded: dict[str, list[str]] = {}

    for parent, children in children_of.items():
        bucket = folded.setdefault(scope_key(parent), [])

        for child in children:
            child_key = scope_key(child)

            if child_key not in bucket:
                bucket.append(child_key)

    return folded


def _deny_result(
    denies: list[dict],
    children_of: dict[str, list[str]],
    principal: str,
    scope: str,
    action: str,
    plane: str,
) -> tuple[bool, UnmodeledControl | None]:
    """(blocked, control). A deny with a condition might block, so it labels the hop instead."""
    principal_key = principal.lower()
    unevaluated: UnmodeledControl | None = None

    for deny in denies:
        principals = deny.get("principals") or []
        principal_keys = {item.lower() for item in principals}
        excluded = {item.lower() for item in deny.get("exclude_principals") or []}

        if principal_key not in principal_keys and "*" not in principals:
            continue

        if principal_key in excluded:
            continue

        deny_scope = scope_key(deny["scope"])
        deny_scopes = [deny_scope]

        if deny.get("apply_to_children", True):
            deny_scopes.extend(descendants_of(children_of, deny_scope))

        if scope not in deny_scopes:
            continue

        for block in deny["permissions"]:
            if not action_permitted([block], action, plane):
                continue

            # A condition can sit on the deny assignment or on one of its permission blocks.
            condition = (deny.get("condition") or block.get("condition") or "").strip()

            if not condition:
                return True, None

            unevaluated = unevaluated or UnmodeledControl(
                "denyWithCondition", principal, deny["scope"], deny.get("name", "deny assignment"),
                condition, deny.get("citation", "deny-assignments.json"),
            )

    return False, unevaluated


def _route(
    blocks: list[Grant],
    denies: list[dict],
    children_of: dict[str, list[str]],
    principal: str,
    scope: str,
    action: str,
    plane: str,
) -> tuple[str, UnmodeledControl | None] | None:
    """(citation, control) when action is granted and not definitely denied, else None."""
    grant = _granting(blocks, action, plane)

    if grant is None:
        return None

    blocked, deny_control = _deny_result(denies, children_of, principal, scope, action, plane)

    if blocked:
        return None

    citation, control = grant

    return citation, control or deny_control


def derive_capability_edges(
    assignments: list[dict],
    role_definitions: dict[str, dict],
    children_of: dict[str, list[str]],
    denies: list[dict],
    resources: list[dict],
) -> list[Edge]:
    """Emit canControlCode and grants from effective actions.

    assignments: principal, role_name, scope, condition, citation.
    role_definitions[role_name]['permissions']: actions, not_actions, data_actions,
    not_data_actions.
    children_of: parent scope id to child scope ids, including resource ids.
    denies: principals ('*' means all), exclude_principals, scope, apply_to_children,
    condition, and permissions in the same shape as a role (a block may carry a condition).
    resources: id, scope, type ('compute' or 'storage'), and for storage a shared_key of
    'enabled', 'not set', or 'disabled', plus capability (the grants target).

    Conditions and missing role definitions are not evaluated here. Skipping them would hide
    a path that may exist; a plain edge would invent one. So each yields an edge carrying an
    UnmodeledControl, granting the most the assignment could: a condition only narrows a role.
    """
    grants_at: dict[tuple[str, str], list[Grant]] = {}
    children_of = _folded_children(children_of)

    for assignment in assignments:
        control = _assignment_control(assignment, role_definitions)
        role = role_definitions.get(assignment["role_name"])
        permissions = role["permissions"] if role is not None else UNKNOWN_ROLE_PERMISSIONS
        assignment_scope = scope_key(assignment["scope"])
        scopes = [assignment_scope, *descendants_of(children_of, assignment_scope)]

        for scope in scopes:
            key = (assignment["principal"], scope)
            grants_at.setdefault(key, []).append((permissions, assignment["citation"], control))

    pending: dict[tuple[str, str, str], tuple[str, UnmodeledControl | None]] = {}

    def remember(source: str, target: str, kind: str, detail: str,
                 control: UnmodeledControl | None) -> None:
        # A hop that holds without any unmodeled control replaces one that needs it.
        earlier = pending.get((source, target, kind))

        if earlier is None or (earlier[1] is not None and control is None):
            pending[(source, target, kind)] = (detail, control)

    for resource in resources:
        scope = scope_key(resource["scope"])

        for (principal, granted_scope), blocks in grants_at.items():
            if granted_scope != scope:
                continue

            def route(action: str, plane: str) -> tuple[str, UnmodeledControl | None] | None:
                return _route(blocks, denies, children_of, principal, scope, action, plane)

            if resource["type"] == "compute":
                code = route(CODE_CONTROL_ACTION, "control")

                if code is not None:
                    remember(principal, resource["id"], "canControlCode",
                             f"{code[0]}; {CODE_CONTROL_ACTION}", code[1])

            if resource["type"] != "storage":
                continue

            # (note, citation, control) for each way this principal can read the data.
            routes: list[tuple[str, str, UnmodeledControl | None]] = []
            shared_key = resource.get("shared_key")

            if shared_key in ("enabled", "not set", "not set (platform default)"):
                keys = route(LIST_KEYS_ACTION, "control")

                if keys is not None:
                    qualifier = (
                        "platform default assumed enabled"
                        if shared_key in ("not set", "not set (platform default)")
                        else "enabled"
                    )
                    routes.append((f"{LIST_KEYS_ACTION} ({qualifier})", *keys))

            blob = route(BLOB_READ_ACTION, "data")

            if blob is not None:
                routes.append((BLOB_READ_ACTION, *blob))

            if routes:
                plain = [item for item in routes if item[2] is None]
                _, citation, control = (plain or routes)[0]
                notes = "; ".join(note for note, _, _ in routes)
                remember(principal, resource["capability"], "grants",
                         f"{citation}; {notes}", control)

    return [
        Edge(source=source, target=target, kind=kind, evidence="derived", detail=detail,
             control=control)
        for (source, target, kind), (detail, control) in pending.items()
    ]


def find_paths(
    edges: list[Edge],
    entry: str,
    target: str,
    max_hops: int = 8,
) -> list[list[Edge]]:
    """Return every simple privilege path from entry to target, shortest first.

    Structural edges are ignored. Walking them would treat role containment as a capability.
    """
    outgoing: dict[str, list[Edge]] = {}

    for edge in edges:
        if edge.kind in STRUCTURAL_KINDS:
            continue

        if edge.kind not in PRIVILEGE_KINDS:
            raise ValueError(f"unknown edge kind: {edge.kind}")

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

        # Avoid revisiting nodes already on this path,
        # so cycles in group nesting can't loop forever.
        visited = {entry} | {edge.target for edge in path}

        for edge in outgoing.get(node, []):
            if edge.target not in visited:
                queue.append((edge.target, path + [edge]))

    return paths
```

Search itself stays a breadth-first walk, which finds shortest paths first. It is naive about scale: real estates still need a hop cap, collapsed Owner-equivalent sets, and a scope-ancestor map computed once rather than walked per assignment. It is not naive about meaning. A path exists only where a privilege edge exists, and those edges exist only where the role's actions survive inheritance and denies. Where a condition or a conditioned deny can't be evaluated, the edge exists and says so.

Every edge still carries its evidence category, a citation, and any unmodeled control. A returned path is already Chapter 2's hop table. The last step is to say how far to trust it:

<!-- listing: lab/listings/python/ch04_paths.py#path_verdict -->

```python
INSUFFICIENT = "Insufficient evidence"


def unmodeled_on(path: list[Edge]) -> list[UnmodeledControl]:
    """Every unmodeled control the path depends on, in hop order."""
    return [edge.control for edge in path if edge.control is not None]


def path_confidence(path: list[Edge], otherwise: str, temporal: str | None = None) -> str:
    """Insufficient evidence if any hop rests on an unmodeled control or the path is
    temporally inconsistent; otherwise the band the hop assumptions earn (Chapter 2)."""
    return INSUFFICIENT if unmodeled_on(path) or temporal else otherwise


def hop_table(path: list[Edge], otherwise: str, temporal: str | None = None) -> list[str]:
    """Chapter 2's hop table as text, each unmodeled control listed as an assumption to check.

    temporal is the reason the path's inputs can't be read as one moment, if there is one.
    """
    lines = [f"Confidence: {path_confidence(path, otherwise, temporal)}"]
    lines += [
        f"{number}. {edge.source} --{edge.kind}--> {edge.target} [{edge.evidence}] {edge.detail}"
        for number, edge in enumerate(path, start=1)
    ]
    lines += [f"Assumption to check: {control.assumption()}" for control in unmodeled_on(path)]

    if temporal:
        lines.append(f"Temporally inconsistent: {temporal}")

    return lines
```

A path with no labeled hop keeps the confidence its evidence earns. A path with one is "Insufficient evidence", the band Chapter 2 uses when a path may or may not exist. The hop table names the assumption, so a reviewer can resolve it: read the condition, check the container or tag it refers to, or collect the missing role definition. Chapter 7 makes sure a summary that cites the path also cites the gap, and Chapter 10 refuses to call a fix verified while a path survives only through a control nobody evaluated.

### Paths across time

A path is a join of facts read at different times (Chapter 3, section 3.5). Each edge kind comes from known snapshot files, so each edge carries the read times of those files. A path carries its **input span**: from the earliest read behind any of its edges to the latest.

<!-- listing: lab/listings/python/ch04_paths.py#input_span -->

```python
from datetime import datetime, timedelta

# The snapshot files each edge kind is derived from (Chapter 3 names them).
KIND_SOURCES = {
    "memberOf": {"transitive-memberships.json"},
    "canSignInAs": {"federated-credentials.json"},
    "canAddCredential": {"application-owners.json", "directory-role-assignments.json"},
    "appFor": {"service-principals.json"},
    "runsAs": {"compute-identities.json"},
    "canControlCode": {
        "role-assignments.json", "role-definitions.json", "deny-assignments.json",
        "scope-parents.json", "transitive-memberships.json", "compute-identities.json",
    },
    "grants": {
        "role-assignments.json", "role-definitions.json", "deny-assignments.json",
        "scope-parents.json", "transitive-memberships.json", "storage-accounts.json",
    },
}

Window = tuple[datetime, datetime]


def parse_utc(value: str) -> datetime:
    """Parse the manifest's UTC timestamps, which end in 'Z'."""
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def read_windows(manifest: dict) -> dict[str, Window]:
    """When each snapshot file's query started and finished."""
    return {
        entry["name"]: (parse_utc(entry["queriedAtUtc"]), parse_utc(entry["completedAtUtc"]))
        for entry in manifest["files"]
    }


def path_inputs(path: list[Edge]) -> list[str]:
    """Every snapshot file the path's edges were derived from."""
    return sorted(set().union(*(KIND_SOURCES[edge.kind] for edge in path)))


def input_span(path: list[Edge], windows: dict[str, Window]) -> Window | None:
    """From the first read behind the path to the last, or None if none was timed."""
    reads = [windows[name] for name in path_inputs(path) if name in windows]

    if not reads:
        return None

    return min(start for start, _ in reads), max(end for _, end in reads)


def temporal_problem(
    path: list[Edge],
    windows: dict[str, Window],
    max_span: timedelta,
    changes: list[tuple[str, datetime]],
) -> str | None:
    """Why the path's inputs can't be treated as one moment, or None if they can.

    changes are (node, time) pairs from change evidence: resourcechanges, the Activity Log,
    or Entra audit logs. A change to any node on the path inside its input span counts.
    """
    span = input_span(path, windows)
    recollect = "re-collect " + ", ".join(path_inputs(path))

    if span is None:
        return f"no read times for its inputs; {recollect}"

    start, end = span

    if end - start > max_span:
        return f"inputs read over {end - start}, more than {max_span}; {recollect}"

    nodes = {path[0].source} | {edge.target for edge in path}
    inside = sorted((at, node) for node, at in changes if node in nodes and start <= at <= end)

    if inside:
        at, node = inside[0]
        return f"{node} changed at {at:%Y-%m-%dT%H:%M:%SZ} while inputs were read; {recollect}"

    return None
```

`KIND_SOURCES` maps edge kinds to files, not each edge to the rows it came from. So the span it computes is never narrower than the truth. A coarse map can make a path look less consistent than it is, but never more.

A path is **temporally inconsistent** in either of two cases:

- **Its input span is longer than `max_span`.** Set `max_span` to the length of a normal collector run in your estate, measured from your own manifests. The Chapter 3 example took under seven minutes. The rationale is that reads inside one run are as close together as your collector can make them. A wider span means the path joined files from different runs, such as this morning's role assignments and last night's Graph files. Don't copy someone else's number. A tenant whose normal run takes an hour needs an hour.
- **Change evidence shows a change to a node on the path inside the span.** The run was short enough, but something on the path moved while it ran.

Either way, `hop_table` reports the path as "Insufficient evidence" and lists the files to re-collect. Once those files are read again together, the label goes away.

The change evidence comes from three places, each with limits. Appendix B.9 has the recipes:

- **Resource Graph `resourcechanges`** covers property changes on Azure resources for 14 days. It never shows Entra objects: app owners, directory roles, and federated credentials on applications don't appear there.
- **The Activity Log** covers control-plane writes such as role assignment changes, for as long as you retain it.
- **Entra audit logs** cover credentials, owners, and directory role changes, but only if you export them to a workspace. Without that export, a change to an Entra object inside the span can't be seen at all.

Map each change to the node it touched (a resource ID, an application, a principal), and pass the list to `temporal_problem`. If an Entra source isn't available, say so in the gap list. Don't treat an empty change list as proof that nothing changed.

### The payments graph

Here's the identity graph around `payments-deploy` after the opening story's discovery. The arrows are privilege edges. Scope containment and the raw role assignments are not drawn; they were consumed when the `canControlCode` and `grants` edges were derived.

```text
[Entry] workflow on production environment ──canSignInAs──┐
                                                          │
user: dev-lead ──────────────canAddCredential─────────────┤
                                                          ▼
user: helpdesk-07 ───────────canAddCredential──────────▶ app: payments-deploy
 (Cloud Application Administrator, tenant scope)       │ appFor
                                                        ▼
                                             sp: payments-deploy
                      canControlCode │                           │ grants
                      (Contributor    │                           │ (Contributor includes
                       includes        │                           │  listKeys; shared key
                       sites/write)    │                           │  enabled on custdata)
                                       ▼                           ▼
                            func: pay-reconcile       [Target] read customer data
                                       │ runsAs
                                       ▼
                            mi: mi-pay-reconcile
                                       │ grants
                                       │ (Storage Blob Data Reader
                                       │  includes blob read)
                                       ▼
                       [Target] read archived customer data
```

Three entry points reach `payments-deploy`: the GitHub workflow, the app owner, and the help-desk user. The help-desk edge is `canAddCredential` because that user holds Cloud Application Administrator. Holding some other directory role would not draw it. From the deployment identity, two derived routes lead to two customer data stores. That's six paths. A Reader assignment on `rg-payments-prod` would add no route. Fixing the GitHub entry point narrowed one arrow at the top. Every other route stayed.

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

### The access-decision contract

"Can read customer data" is a strong sentence. It should never sound stronger than the evidence behind it. An **access-decision contract** states, for one target, which of the controls that decide access the analysis models and what happens when it meets one it doesn't. Here is the contract for the book's main target, reading blob data in a storage account:

| Control | Modeled in the book's code? | Result for an instance the code can't evaluate |
|---------|-----------------------------|------------------------------------------------|
| Azure RBAC data roles (DataActions) | Yes | A role whose definition wasn't collected is treated as allowing everything. The edge is labeled `missingRoleDefinition`. |
| Key listing plus shared key (H7) | Yes | Shared key `not set` is treated as enabled, so the edge is drawn. |
| Deny assignments | Yes, including excluded principals | A deny with a condition labels the hop `denyWithCondition` instead of blocking it. |
| Role-assignment conditions | Recorded, not evaluated | The edge is drawn at the role's upper bound and labeled `roleCondition`. |
| PIM eligibility (`canActivate`) | Not in the section 4.5 sketch | No edge: eligible assignments aren't in `role-assignments.json`, so the path is missed. Rule 5 says how to add them. |
| Storage firewall, private endpoint, DNS | Not modeled here (Chapter 5) | The identity path stands. Network reachability is a separate claim. When Chapter 5's `canReach` edges are added, an indeterminate hop is labeled `networkIndeterminate`. |
| SAS issuance | Not modeled | A SAS already handed out is a credential outside the snapshot. A "no path" result says nothing about it. |
| Local authentication (keys or SAS held outside Azure, anonymous blob access) | Not modeled | Not drawn. A "no path" result says nothing about it. |
| Conditional Access for workload identities | Not modeled | The path is reported even if a policy would block the sign-in. |

Read the third column for the direction of each error. The labeled rows and the Conditional Access row can report a path that doesn't hold, and the label or the contract says so. The PIM, SAS, and local-authentication rows can miss a path. Those are the rows to name whenever you say "no path". Chapter 5 covers the network rows. Publish the contract with the analysis, and change it when the code changes.

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

The last two bridges mean the graph needs edges like "can modify membership of" and "can reset credentials of". Those come from directory role assignments and group ownership. Chapter 3's collector is allowed to read them (`RoleManagement.Read.Directory`, `GroupMember.Read.All`). The queries that write the files are in this chapter's lab.

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

So: **never let a model decide what a role permits.** Look it up in the role definitions you collected (Chapter 3), compute effective actions deterministically, and give the model the result to explain.

**Graph search fails.** Ask a model to "find all the ways to reach `custdata`" from a large dump of role assignments and memberships, and it will find some, miss others, and occasionally invent an edge, such as a membership that doesn't exist or a role at the wrong scope. Graph search is exactly the exhaustive, repeatable work that deterministic code does well and models don't.

---

## 4.10 Lab: the identity graph for the payments estate

This lab builds the identity graph for the payments estate and finds every path from three entry points to two customer data targets.

**Setup.** The companion lab tenant (Appendix A) includes the opening story's configuration: an owner on `payments-deploy`, a user with Cloud Application Administrator, and a Function App with a user-assigned managed identity that holds Storage Blob Data Reader on `custarchive`. Start from the Chapter 3 snapshot (`storage-accounts.json`, `role-assignments.json`, `subscriptions.json`, `federated-credentials.json`, service principals). That snapshot does not include application owners, directory role assignments, transitive memberships, role definition actions, deny assignments, or compute identity attachments. Re-running the Chapter 3 collector leaves Steps 1–3 without those files. Collect them in Step 0, into the same snapshot directory, and re-hash `manifest.json`. Run Step 0 straight after the Chapter 3 collector, in the same session. Every path joins Chapter 3 files with Step 0 files, so a Step 0 run hours later makes every path temporally inconsistent (section 4.5).

Confirm `role-assignments.json` still has the `condition` column from section 3.3. Role names alone are not enough to derive edges.

**Step 0 — Collect the missing inputs.** Reuse `Invoke-ArgQuery`, `Connect-MgGraph -Identity`, `$snapshotDir`, and the `$applications` list from the Chapter 3 lab. The same Graph application permissions are enough: `Application.Read.All` covers owners, `GroupMember.Read.All` covers transitive membership, and `RoleManagement.Read.Directory` covers directory roles.

<!-- listing: lab/listings/powershell/ch04-step0-graph-owners-roles-memberships.ps1 -->

```powershell
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
```

Save those three results with `Save-SnapshotFile` from the Chapter 3 lab, as `application-owners`, `directory-role-assignments`, and `transitive-memberships`, so each file records its own read times. Take each `-QueriedAtUtc` from `Get-UtcStamp` just before its loop starts.

Then collect the Azure rows the derivation reads. `identity.userAssignedIdentities` is a map from identity resource id to `{clientId, principalId}`. Keep the map. The principal id is what joins to `role-assignments.json`.

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

<!-- listing: lab/listings/kql/appb-deny-assignments.kql -->

```kusto
authorizationresources
| where type =~ 'microsoft.authorization/denyassignments'
| mv-expand permission = properties.permissions
| project
    id,
    scope = tostring(properties.scope),
    doNotApplyToChildScopes = tobool(properties.doNotApplyToChildScopes),
    principals = properties.principals,
    excludePrincipals = properties.excludePrincipals,
    condition = tostring(properties.condition),
    actions = permission.actions,
    notActions = permission.notActions,
    dataActions = permission.dataActions,
    notDataActions = permission.notDataActions,
    permissionCondition = tostring(permission.condition)
```

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

Write those to `role-definitions.json`, `deny-assignments.json`, `compute-identities.json`, and `scope-parents.json`. In `deny-assignments.json`, the loader maps `excludePrincipals` to the deny's `exclude_principals`, the deny-level `condition` to the deny, and `permissionCondition` to the permission block it came from. Add each compute resource id as a child of its `parentScope`. For each storage account, construct its parent scope as `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}`, then add its resource id as a child of that scope so inheritance reaches the resource and not only the resource group.

**Deployment actions (payments lab).** Map each compute resource to the control-plane action your loader treats as `canControlCode`. The sketch in section 4.5 uses `CODE_CONTROL_ACTION` (`Microsoft.Web/sites/write`). Use this table in Step 1; confirm against built-in role definitions and the resource `type` in `compute-identities.json`.

| Snapshot `type` | `canControlCode` action | Notes |
|-----------------|-------------------------|-------|
| `microsoft.web/sites` (Function App) | `Microsoft.Web/sites/write` | Matches the payments lab Function App and the derivation sketch. |
| `microsoft.web/sites` (App Service) | `Microsoft.Web/sites/write` | Same action family for web workloads in this lab. |
| `Microsoft.Automation/automationAccounts` | `Microsoft.Automation/automationAccounts/write` | Automation account control plane; verify job run permissions separately. |
| `Microsoft.Logic/workflows` | `Microsoft.Logic/workflows/write` | Logic App workflow resource. |

**Step 1 — Derive privilege edges.** Write a loader that reads those files and emits `Edge` records (section 4.5). Call `expand_group_assignments` and `derive_capability_edges`. Do not pass `hasRoleAt` or `contains` to `find_paths`. `find_paths` ignores those two kinds; a loader that emits only them will find no paths, which is the correct failure if derivation never ran.

1. `memberOf` from `transitive-memberships.json`.
2. `canSignInAs` from federated credentials, from an entry-point node named after the subject.
3. `canAddCredential` from `application-owners.json` (owner to application).
4. `canAddCredential` from a directory role holder to each application, only when the role is Application Administrator, Cloud Application Administrator, or Global Administrator, and `directoryScopeId` is tenant-wide (`/`). Any other directory role, and any assignment scoped to an administrative unit, must not fan out to every app.
5. `appFor` links joined through `appId`.
6. `runsAs` from `compute-identities.json` (observed): the compute resource to each attached managed identity's principal id.
7. `canControlCode` and `grants` only from `derive_capability_edges`, after role definitions, inheritance, transitive membership, and denies. Conditions and missing role definitions come through as labeled edges, not as missing ones. Pick the code-control action from the deployment-actions table for the resource `type`. For storage, emit `grants` for list keys only when shared key is `enabled` or `not set`, and emit `grants` for blob read only from DataActions.

Every edge cites the snapshot file and row. Derived edges also cite the action and the rule.

**Step 2 — Search.** Run `find_paths` from each entry point to each target capability. List the paths shortest first, and print each one with `hop_table`, so every path shows its confidence, its hops with evidence categories, and any assumption it rests on. Pass it the result of `temporal_problem`. Use `read_windows` on the manifest, a `max_span` equal to your collector's normal run length, and the changes from Appendix B.9 for the run's window. A path that contains `hasRoleAt` or `contains` is a bug in the loader, not a finding.

**Step 3 — Check against the opening story.** The lab starts with the original `main` branch subject in place. Confirm that you find all three entry points into `payments-deploy` (the `main` workflow, the app owner, and the help-desk user) and both routes out of it, for six paths in total. Then add a Reader assignment on `rg-payments-prod` for a fourth user and search again. That user must have no path to either target. If they do, the loader is still treating role containment as a capability.

If you find fewer than six paths, the usual misses are the `appId` join, transitive membership, a directory role that was not turned into `canAddCredential`, or a managed identity attachment that never became `runsAs`.

None of the six paths carries an unmodeled control, because the lab has no conditioned assignments. With Step 0 run straight after the Chapter 3 collector, none is temporally inconsistent either. Each prints with the confidence its evidence earns.

**Step 3a (optional) — A control the search can't evaluate.** Give `analyst-04` Storage Blob Data Reader on `custdata`, with a condition that limits reads to a container named `reports` (Appendix A.7 has the Terraform). Re-run Step 0, derive, and search. You should now find a seventh path, one hop from `analyst-04` to reading customer data. Its hop table must say "Confidence: Insufficient evidence" and list the condition as the assumption to check. If the path is missing, the loader is still dropping conditioned assignments. If it prints with any other confidence, the label was lost between derivation and printing. Remove the assignment before Step 4.

**Step 3b (optional) — A path from two runs.** Re-run only Step 0 the next day, into the same snapshot directory, and search again. The six paths are the same, but each one now prints "Confidence: Insufficient evidence" and "Temporally inconsistent", with an input span close to a day and the files to re-collect. Then re-run the Chapter 3 collector and Step 0 together, and confirm the label is gone.

**Step 4 — Apply the original fix.** Change the federated credential to the `production` environment subject in the lab. Re-run the Chapter 3 collector and Step 0, then search again. Confirm that the `main` entry point is replaced by the narrower production-environment entry, and that the four paths through the app owner and the help-desk user are unchanged.

**Step 5 — Find a better fix.** Look at the graph and answer: which single change removes the most paths? Candidates include removing the developer's app ownership, removing the directory role, narrowing `payments-deploy` from Contributor, and disabling shared key access. Write down your answer. Chapter 9 returns to this question formally as cut-point analysis.

**What you should see.** With the Step 0 files loaded and capability edges derived, the original fix narrows only the two paths that start from the GitHub workflow. It does not touch the four paths through the app owner and the help-desk user. All six paths converge on `payments-deploy`, so narrowing its role is the obvious next idea, and it closes the three paths to `custdata`, because Contributor's list-keys action is what produced that `grants` edge. It doesn't close the three archive paths while the pipeline deploys `pay-reconcile`: the narrowed role must still allow code deployment, so `canControlCode` stays, and whoever deploys code can act as that code. That convergence is the lesson of this chapter: protect the identities that many paths pass through, not just the doors in front of them. Chapter 9 works out which combination of changes closes the rest. A search over the Chapter 3 files alone, or over raw `hasRoleAt` and `contains`, is not this result.

---

## Summary

- In Azure, **identity is the perimeter**. Most serious paths are chains of identity hops: membership, role, become, grant, control.
- Effective access is a **derived fact** built from five rules: scopes inherit downward, groups expand transitively, roles have **control-plane and data-plane** actions, deny assignments and conditions subtract, and **eligible is not active**.
- What the derivation can't evaluate, such as a role condition, is kept as a hop labeled with an **unmodeled control**. A path through it is "Insufficient evidence", and an **access-decision contract** says which controls the analysis models at all.
- Every path carries an **input span**, from its earliest read to its latest. A span longer than one collector run, or a change on the path inside it, makes the path **temporally inconsistent**, and it is "Insufficient evidence" until its files are re-collected together.
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
- **Unmodeled control** — a control the derivation found but can't evaluate, such as a role condition; the hop is kept and labeled with it.
- **Access-decision contract** — for one target, the controls that decide access, whether the analysis models each, and what an unmodeled instance produces.
- **Input span** — the time from the earliest snapshot read behind a path to the latest.
- **Temporally inconsistent** — a path whose input span is longer than one collector run, or that saw a change on the path inside its span.

---

## Author notes (remove before submission)

- Verified 2026-10-10 (revision pass 1): Contributor NotActions; roles with `roleAssignments/write`; PIM eligibility APIs and read permission; Application Administrator and Cloud Application Administrator credential scope; Privileged Role Administrator removed from `canAddCredential` because it escalates by assignment; Global Administrator elevation; Graph self-escalation permission names; GitHub fork token default and immutable subjects; flexible credential syntax; section 4.6 conversions.
- Verify: managed identity attach permissions (assign action on user-assigned identity) and which built-in roles include code deployment for Functions, App Service, Automation, and Logic Apps. The lab uses `Microsoft.Web/sites/write` as the representative Function App action; confirm whether publish uses that action, `Microsoft.Web/sites/publish/action`, or both.
- Verify Step 0 cmdlets and payload shapes: `Get-MgApplicationOwner`, `Get-MgRoleManagementDirectoryRoleAssignment`, `Get-MgRoleManagementDirectoryRoleDefinition`, `Get-MgGroupTransitiveMember`; directory role template ids; `identity.userAssignedIdentities` principalId; deny assignment `principals` and `doNotApplyToChildScopes`; management group `properties.details.parent.id`.
- Built-in directory role template ids used as a sanity check on `directory-role-assignments.json` (verified 2026-10-10): Cloud Application Administrator `158c047a-c907-4556-b7ef-446551a6b5f7`, Application Administrator `9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3`, Global Administrator `62e90394-69f5-4237-9190-012177145e10`.
- Consider a figure for section 4.5's payments graph instead of ASCII.
- Add the Chapter 4 fact checks to GTM **M-306** when it is picked up.
- 2026-10-11 (review comment on unmodeled controls): the derivation no longer skips conditioned assignments. Conditions, missing role definitions, and conditioned denies now produce labeled edges, a path through one is "Insufficient evidence", and deny `excludePrincipals` is honored. Added `path_verdict`, the access-decision contract in section 4.6, and optional Step 3a. Tests in `test_ch04_paths.py` cover each case and confirm the plain lab still yields exactly P1 to P6. Verify before submission: the deny assignment `condition`, `conditionVersion`, `excludePrincipals`, and permission-level `condition` fields in Resource Graph rows (REST api-version 2022-04-01 documents them); and the scope of Conditional Access for workload identities (single-tenant service principals; managed identities not covered) before adding detail to the contract row.
- 2026-10-12 (network ladder): `find_paths` now walks `canReach` edges (it didn't, so Chapter 5 Step 7 couldn't work), and `UnmodeledControl` has a fourth kind, `networkIndeterminate`, produced by Chapter 5's `reach_edge`. Added `canReach` to the section 4.5 edge table.
- 2026-10-12 (review comment on temporal consistency): added "Paths across time" with the `input_span` listing. `KIND_SOURCES` and `parse_utc` moved here from Chapter 10, which now imports them. `hop_table` takes the temporal reason. The threshold has no default number: it is the reader's own normal run length, for the reason given in the text. Added the Setup note, Step 0 saving through `Save-SnapshotFile`, the Step 2 call, and optional Step 3b. Tests in `test_ch04_paths.py` (`InputSpans`) cover a one-run path, a later-run input, a change inside and outside the span, and untimed inputs.
