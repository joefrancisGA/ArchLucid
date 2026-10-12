> **Scope:** Chapter 5 revised draft for the book draft *Managing Azure Security with AI*, split from Chapter 4 on 2026-10-12. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft — revised (revision pass 1, 2026-10-10; split 2026-10-12)

# Chapter 5 — Building the identity graph

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: revised (revision pass 1, 2026-10-10; split 2026-10-12). Target 6,000 words. Facts about Azure and Entra ID behavior were checked against Microsoft documentation in October 2026; dated "As of" notes mark the ones to re-check before submission.*

**Builds on:** Chapter 2 (evidence categories, section 2.2), Chapter 3 (the snapshot, its read times, and its gaps, sections 3.5 and 3.7), Chapter 4 (the five rules and the become and grant hops, sections 4.2 to 4.5).

---

## The export that showed nothing

In this fictional scenario, a week after the GitHub fix in Chapter 4, Contoso's payments lead asked a reasonable question: who can still become `payments-deploy`? An analyst exported every Azure role assignment in the subscription and filtered it to the payments resource groups.

The export was short. `payments-deploy` held Contributor on `rg-payments-prod`. A handful of other identities held roles on sandbox groups. Nothing in the file mentioned the storage accounts by name, and nothing mentioned the developer or the help-desk user. The lead read that as "the fix held" and closed the follow-up.

It hadn't. The file was role assignments. Application owners are not role assignments, and neither are directory roles. The developer was an owner of the app registration. The help-desk user held Cloud Application Administrator. Both can add a credential and sign in as `payments-deploy` (section 4.3), and neither row exists in the export the lead read. When the same snapshot was turned into the graph this chapter builds, the search drew six paths, and all six passed through that one identity.

The export wasn't wrong. It was the wrong object. This chapter is about building the object the question actually needs.

Chapter 4 defined the hop types. This chapter builds them into a graph from a Chapter 3 snapshot plus the files this chapter's lab adds: application owners, directory role assignments, transitive memberships, role definition actions, deny assignments, scope parents, and compute identity attachments. The Chapter 3 lab does not write those files.

The graph is the book's main analytical tool. Chapter 7 adds network edges to it, Chapter 9 explains its paths, Chapter 11 ranks and cuts them, and Chapter 12 re-runs its search to verify a fix.

---

## 5.1 Nodes

| Node type | Examples |
|-----------|----------|
| **Principal** | User, group, service principal, managed identity |
| **Application** | App registration (holds federated credentials and owners) |
| **Scope** | Management group, subscription, resource group |
| **Resource** | Storage account, Function App, VM, key vault |
| **Capability** | "Read blob data in `custdata`", "Write role assignments at `rg-payments-prod`" |
| **Entry point** | "Workflow on `main` in `contoso/payments`", "Any guest user", "Internet" |

Capability nodes are worth the extra modeling. Targets are usually capabilities, such as reading this data or changing this deployment, not resources. Making them nodes lets one search answer "who can read customer data?" across many resources and routes.

---

## 5.2 Edges

Every edge has a **type**, the **evidence** behind it, and its **evidence category** (section 2.2):

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
| `canReach` | Network position → Endpoint | Deterministic inference from network configuration (Chapter 7); an indeterminate hop carries an unmodeled control |

---

## 5.3 From assignments to edges

Search must not walk raw role assignments or scope containment. `hasRoleAt` records that a principal was assigned a role at a scope. `contains` records that a scope is inside another scope. Neither one says what the role allows. Chaining them to `runsAs` or `grants` makes every assignment at that scope, including Reader, look able to deploy code or read data.

Derive `canControlCode` and `grants` first, using the five rules in section 4.2:

- inherit the assignment down the scope tree,
- copy group assignments onto transitive members,
- evaluate the role definition's Actions, NotActions, DataActions, and NotDataActions,
- subtract deny assignments, except for principals the deny excludes,
- keep what the derivation can't evaluate, and label it.

The last rule needs a reason. A role-assignment condition only narrows what the role allows. So the most the assignment could grant is the role without its condition, and the derivation draws edges at that upper bound. Each such edge carries an **unmodeled control**: the condition text, the assignment it came from, and its citation. Two other cases get the same treatment. A role whose definition wasn't collected is treated as allowing everything, and the edge says the definition is missing. A deny assignment with a condition might or might not block, so it labels the hop instead of removing it.

The label lives on the edge rather than in a separate list of caveats, so search carries it into every path that uses the hop. A path that uses even one labeled edge is reported with the assumption it rests on, and it never reads as confirmed. Where the same hop also exists without any control, the plain edge replaces the labeled one, because the hop holds either way.

Only the resulting privilege edges go into search. A Reader assignment produces neither `canControlCode` nor a list-keys `grants` edge, so it cannot reach the targets. Contributor can, because its Actions are `*` and its NotActions do not remove `Microsoft.Web/sites/write` or `Microsoft.Storage/storageAccounts/listKeys/action` [S1].

The sketch below uses only the Python standard library. It is the loader's derivation, not a second authorization system inside the search.

<!-- listing: lab/listings/python/ch05_paths.py#identity_graph -->

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

<!-- listing: lab/listings/python/ch05_paths.py#path_verdict -->

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

A path with no labeled hop keeps the confidence its evidence earns. A path with one is "Insufficient evidence", the band for a path that may or may not exist (section 2.5). The hop table names the assumption, so a reviewer can resolve it: read the condition, check the container or tag it refers to, or collect the missing role definition. Chapter 9 makes sure a summary that cites the path also cites the gap, and Chapter 12 refuses to call a fix verified while a path survives only through a control nobody evaluated.

---

## 5.4 Paths across time

A path is a join of facts read at different times (Chapter 3, section 3.5). Each edge kind comes from known snapshot files, so each edge carries the read times of those files. A path carries its **input span**: from the earliest read behind any of its edges to the latest.

<!-- listing: lab/listings/python/ch05_paths.py#input_span -->

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

- **Resource Graph `resourcechanges`** covers property changes on Azure resources for 14 days [S2]. It never shows Entra objects: app owners, directory roles, and federated credentials on applications don't appear there [S2].
- **The Activity Log** covers control-plane writes such as role assignment changes, for as long as you retain it [S3].
- **Entra audit logs** cover credentials, owners, and directory role changes [S4], but only if you export them to a workspace [S4]. Without that export, a change to an Entra object inside the span can't be seen at all [S4].

Map each change to the node it touched (a resource ID, an application, a principal), and pass the list to `temporal_problem`. If an Entra source isn't available, say so in the gap list. Don't treat an empty change list as proof that nothing changed.

---

## 5.5 The payments graph

Here's the identity graph around `payments-deploy` after the discovery in Chapter 4's opening story. The arrows are privilege edges. Scope containment and the raw role assignments are not drawn; they were consumed when the `canControlCode` and `grants` edges were derived.

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

Three entry points reach `payments-deploy`: the GitHub workflow, the app owner, and the help-desk user. The help-desk edge is `canAddCredential` because that user holds Cloud Application Administrator [S5]. Holding some other directory role would not draw it [S5]. From the deployment identity, two derived routes lead to two customer data stores. That's six paths. A Reader assignment on `rg-payments-prod` would add no route [S1]. Fixing the GitHub entry point narrowed one arrow at the top. Every other route stayed.

---

## 5.6 The access-decision contract

"Can read customer data" is a strong sentence. It should never sound stronger than the evidence behind it. An **access-decision contract** states, for one target, which of the controls that decide access the analysis models and what happens when it meets one it doesn't. Here is the contract for the book's main target, reading blob data in a storage account:

| Control | Modeled in the book's code? | Result for an instance the code can't evaluate |
|---------|-----------------------------|------------------------------------------------|
| Azure RBAC data roles (DataActions) | Yes | A role whose definition wasn't collected is treated as allowing everything. The edge is labeled `missingRoleDefinition`. |
| Key listing plus shared key (H7) | Yes | Shared key `not set` is treated as enabled, so the edge is drawn [S6]. |
| Deny assignments | Yes, including excluded principals | A deny with a condition labels the hop `denyWithCondition` instead of blocking it. |
| Role-assignment conditions | Recorded, not evaluated | The edge is drawn at the role's upper bound and labeled `roleCondition`. |
| PIM eligibility (`canActivate`) | Not in the section 5.3 sketch | No edge: eligible assignments aren't in `role-assignments.json`, so the path is missed. Rule 5 says how to add them. |
| Storage firewall, private endpoint, DNS | Not modeled here (Chapter 7) | The identity path stands. Network reachability is a separate claim. When Chapter 7's `canReach` edges are added, an indeterminate hop is labeled `networkIndeterminate`. |
| SAS issuance | Not modeled | A SAS already handed out is a credential outside the snapshot. A "no path" result says nothing about it. |
| Local authentication (keys or SAS held outside Azure, anonymous blob access) | Not modeled | Not drawn. A "no path" result says nothing about it. |
| Conditional Access for workload identities | Not modeled | The path is reported even if a policy would block the sign-in. |

Read the third column for the direction of each error. The labeled rows and the Conditional Access row can report a path that doesn't hold, and the label or the contract says so. The PIM, SAS, and local-authentication rows can miss a path. Those are the rows to name whenever you say "no path". Section 7.1 covers the network rows. Publish the contract with the analysis, and change it when the code changes.

---

## 5.7 Keeping the graph useful

A complete identity graph for a large tenant has millions of edges. Most of it is noise. Some practical rules keep it usable:

- **Start from targets, not from everything.** Define a short list of target capabilities (Chapter 1, section 1.7) and search backward from them. You don't need every path in the tenant, just the ones that end somewhere that matters.
- **Collapse Owner-equivalence.** Precompute, for each scope, the set of identities that are Owner-equivalent: Owner, User Access Administrator, RBAC Administrator, or anyone who can become one. Use that set as a single node rather than expanding every assignment.
- **Treat high-scope roles as a finding in themselves.** If 40 identities hold Contributor at the root management group, every target is a few hops from 40 entry points. That's not 4,000 paths to report; it's one structural problem to report.
- **Label break-glass accounts** as human assertions with owners and expiry ("emergency access account; sign-ins alerted to SOC"). Don't hide them. Make their monitoring explicit.
- **Record what's outside Azure.** GitHub branch protection, Azure DevOps permissions, and HR processes for joiners and leavers are part of many paths. If you don't collect them, mark the edge as an assumption.

---

## 5.8 Lab: the identity graph for the payments estate

This lab builds the identity graph for the payments estate and finds every path from three entry points to two customer data targets.

**Setup.** The companion lab tenant (Appendix A) includes Chapter 4's opening story configuration: an owner on `payments-deploy`, a user with Cloud Application Administrator, and a Function App with a user-assigned managed identity that holds Storage Blob Data Reader on `custarchive`. Start from the Chapter 3 snapshot (`storage-accounts.json`, `role-assignments.json`, `subscriptions.json`, `federated-credentials.json`, service principals). That snapshot does not include application owners, directory role assignments, transitive memberships, role definition actions, deny assignments, or compute identity attachments. Re-running the Chapter 3 collector leaves Steps 1–3 without those files. Collect them in Step 0, into the same snapshot directory, and re-hash `manifest.json`. Run Step 0 straight after the Chapter 3 collector, in the same session. Every path joins Chapter 3 files with Step 0 files, so a Step 0 run hours later makes every path temporally inconsistent (section 5.4).

Confirm `role-assignments.json` still has the `condition` column from section 3.3. Role names alone are not enough to derive edges.

**Step 0 — Collect the missing inputs.** Reuse `Invoke-ArgQuery`, `Connect-MgGraph -Identity`, `$snapshotDir`, and the `$applications` list from the Chapter 3 lab. The same Graph application permissions are enough: `Application.Read.All` covers owners, `GroupMember.Read.All` covers transitive membership, and `RoleManagement.Read.Directory` covers directory roles.

<!-- listing: lab/listings/powershell/ch05-step0-graph-owners-roles-memberships.ps1 -->

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

Deny assignments are the exception to "use Resource Graph". They aren't a documented type in its `authorizationresources` table [S7], so the deny listing reads them from the Authorization REST API for each subscription in `subscriptions.json` [S8], and writes one row per permission block.

Write those to `role-definitions.json`, `deny-assignments.json`, `compute-identities.json`, and `scope-parents.json`. In `deny-assignments.json`, the loader maps `excludePrincipals` to the deny's `exclude_principals`, the deny-level `condition` to the deny, and `permissionCondition` to the permission block it came from. Add each compute resource id as a child of its `parentScope`. For each storage account, construct its parent scope as `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}`, then add its resource id as a child of that scope so inheritance reaches the resource and not only the resource group.

**Deployment actions (payments lab).** Map each compute resource to the control-plane action your loader treats as `canControlCode`. The sketch in section 5.3 uses `CODE_CONTROL_ACTION` (`Microsoft.Web/sites/write`). Use this table in Step 1; confirm against built-in role definitions and the resource `type` in `compute-identities.json`.

| Snapshot `type` | `canControlCode` action | Notes |
|-----------------|-------------------------|-------|
| `microsoft.web/sites` (Function App) | `Microsoft.Web/sites/write` | Matches the payments lab Function App and the derivation sketch. |
| `microsoft.web/sites` (App Service) | `Microsoft.Web/sites/write` | Same action family for web workloads in this lab. |
| `Microsoft.Automation/automationAccounts` | `Microsoft.Automation/automationAccounts/write` | Automation account control plane; verify job run permissions separately. |
| `Microsoft.Logic/workflows` | `Microsoft.Logic/workflows/write` | Logic App workflow resource. |

**Step 1 — Derive privilege edges.** Write a loader that reads those files and emits `Edge` records (section 5.3). Call `expand_group_assignments` and `derive_capability_edges`. Do not pass `hasRoleAt` or `contains` to `find_paths`. `find_paths` ignores those two kinds; a loader that emits only them will find no paths, which is the correct failure if derivation never ran.

1. `memberOf` from `transitive-memberships.json`.
2. `canSignInAs` from federated credentials, from an entry-point node named after the subject.
3. `canAddCredential` from `application-owners.json` (owner to application).
4. `canAddCredential` from a directory role holder to each application, only when the role is Application Administrator, Cloud Application Administrator, or Global Administrator, and `directoryScopeId` is tenant-wide (`/`). Any other directory role, and any assignment scoped to an administrative unit, must not fan out to every app.
5. `appFor` links joined through `appId`.
6. `runsAs` from `compute-identities.json` (observed): the compute resource to each attached managed identity's principal id.
7. `canControlCode` and `grants` only from `derive_capability_edges`, after role definitions, inheritance, transitive membership, and denies. Conditions and missing role definitions come through as labeled edges, not as missing ones. Pick the code-control action from the deployment-actions table for the resource `type`. For storage, emit `grants` for list keys only when shared key is `enabled` or `not set`, and emit `grants` for blob read only from DataActions.

Every edge cites the snapshot file and row. Derived edges also cite the action and the rule.

**Step 2 — Search.** Run `find_paths` from each entry point to each target capability. List the paths shortest first, and print each one with `hop_table`, so every path shows its confidence, its hops with evidence categories, and any assumption it rests on. Pass it the result of `temporal_problem`. Use `read_windows` on the manifest, a `max_span` equal to your collector's normal run length, and the changes from Appendix B.9 for the run's window. A path that contains `hasRoleAt` or `contains` is a bug in the loader, not a finding.

**Step 3 — Check against Chapter 4's opening story.** The lab starts with the original `main` branch subject in place. Confirm that you find all three entry points into `payments-deploy` (the `main` workflow, the app owner, and the help-desk user) and both routes out of it, for six paths in total. Then add a Reader assignment on `rg-payments-prod` for a fourth user and search again. That user must have no path to either target. If they do, the loader is still treating role containment as a capability.

If you find fewer than six paths, the usual misses are the `appId` join, transitive membership, a directory role that was not turned into `canAddCredential`, or a managed identity attachment that never became `runsAs`.

None of the six paths carries an unmodeled control, because the lab has no conditioned assignments. With Step 0 run straight after the Chapter 3 collector, none is temporally inconsistent either. Each prints with the confidence its evidence earns.

**Step 3a (optional) — A control the search can't evaluate.** Give `analyst-04` Storage Blob Data Reader on `custdata`, with a condition that limits reads to a container named `reports` (Appendix A.7 has the Terraform). Re-run Step 0, derive, and search. You should now find a seventh path, one hop from `analyst-04` to reading customer data. Its hop table must say "Confidence: Insufficient evidence" and list the condition as the assumption to check. If the path is missing, the loader is still dropping conditioned assignments. If it prints with any other confidence, the label was lost between derivation and printing. Remove the assignment before Step 4.

**Step 3b (optional) — A path from two runs.** Re-run only Step 0 the next day, into the same snapshot directory, and search again. The six paths are the same, but each one now prints "Confidence: Insufficient evidence" and "Temporally inconsistent", with an input span close to a day and the files to re-collect. Then re-run the Chapter 3 collector and Step 0 together, and confirm the label is gone.

**Step 4 — Apply the original fix.** Change the federated credential to the `production` environment subject in the lab. Re-run the Chapter 3 collector and Step 0, then search again. Confirm that the `main` entry point is replaced by the narrower production-environment entry, and that the four paths through the app owner and the help-desk user are unchanged.

**Step 5 — Find a better fix.** Look at the graph and answer: which single change removes the most paths? Candidates include removing the developer's app ownership, removing the directory role, narrowing `payments-deploy` from Contributor, and disabling shared key access. Write down your answer. Section 11.3 answers it formally as cut-point analysis.

**What you should see.** With the Step 0 files loaded and capability edges derived, the original fix narrows only the two paths that start from the GitHub workflow. It does not touch the four paths through the app owner and the help-desk user. All six paths converge on `payments-deploy`, so narrowing its role is the obvious next idea, and it closes the three paths to `custdata`, because Contributor's list-keys action is what produced that `grants` edge [S1, S6]. It doesn't close the three archive paths while the pipeline deploys `pay-reconcile`: the narrowed role must still allow code deployment, so `canControlCode` stays, and whoever deploys code can act as that code [S1, S9]. That convergence is the lesson of Chapters 4 and 5: protect the identities that many paths pass through, not just the doors in front of them. Chapter 11 works out which combination of changes closes the rest. A search over the Chapter 3 files alone, or over raw `hasRoleAt` and `contains`, is not this result.

---

## Sources

- **[S1]** Understand Azure role definitions. Microsoft Learn. <https://learn.microsoft.com/azure/role-based-access-control/role-definitions> Checked 2026-10-12. Kind: documented.
- **[S2]** Analyze changes to your Azure resources with Change Analysis. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/changes/resource-graph-changes> Checked 2026-10-12. Kind: documented.
- **[S3]** Azure activity log. Microsoft Learn. <https://learn.microsoft.com/azure/azure-monitor/essentials/activity-log> Checked 2026-10-12. Kind: documented.
- **[S4]** Learn about the audit logs in Microsoft Entra ID. Microsoft Learn. <https://learn.microsoft.com/entra/identity/monitoring-health/concept-audit-logs> Checked 2026-10-12. Kind: documented.
- **[S5]** Microsoft Entra built-in roles - permissions reference. Microsoft Learn. <https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference> Checked 2026-10-12. Kind: documented.
- **[S6]** Manage storage account access keys. Microsoft Learn. <https://learn.microsoft.com/azure/storage/common/storage-account-keys-manage> Checked 2026-10-12. Kind: documented.
- **[S7]** Azure Resource Graph table and resource type reference. Microsoft Learn. <https://learn.microsoft.com/azure/governance/resource-graph/reference/supported-tables-resources> Checked 2026-10-12. Kind: documented.
- **[S8]** Deny Assignments - List. Microsoft Learn. <https://learn.microsoft.com/rest/api/authorization/deny-assignments/list?view=rest-authorization-2022-04-01> Checked 2026-10-12. Version: 2022-04-01. Kind: documented.
- **[S9]** Managed identities for Azure resources overview. Microsoft Learn. <https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview> Checked 2026-10-12. Kind: documented.

---

## Summary

- Build the graph from **typed, cited, evidence-labeled edges**. Search walks only edges that mean "can". Role assignments and scope containment are **derivation inputs**, not hops.
- What the derivation can't evaluate, such as a role condition, is kept as a hop labeled with an **unmodeled control**. A path through it is "Insufficient evidence", and an **access-decision contract** says which controls the analysis models at all.
- Every path carries an **input span**, from its earliest read to its latest. A span longer than one collector run, or a change on the path inside it, makes the path **temporally inconsistent**, and it is "Insufficient evidence" until its files are re-collected together.
- **Search backward from targets**, collapse **Owner-equivalent** identities, and report a high-scope role as one structural finding rather than thousands of paths.
- In the payments estate, all six paths pass through `payments-deploy`. Protect the identities many paths share, not just the doors in front of them.

## Key terms

- **Capability node** — a graph node representing an action that matters, such as reading specific data.
- **Owner-equivalent** — any identity that can obtain Owner at a scope, directly or by granting itself roles.
- **Unmodeled control** — a control the derivation found but can't evaluate, such as a role condition; the hop is kept and labeled with it.
- **Access-decision contract** — for one target, the controls that decide access, whether the analysis models each, and what an unmodeled instance produces.
- **Input span** — the time from the earliest snapshot read behind a path to the latest.
- **Temporally inconsistent** — a path whose input span is longer than one collector run, or that saw a change on the path inside its span.

---

## Author notes (remove before submission)

- 2026-10-12 (chapter split): split from the old Chapter 4. The old section 4.5's subsections became sections 5.1 to 5.5; the access-decision contract (old section 4.6), "Keeping the graph useful" (old 4.8), and the lab (old 4.10) became sections 5.6 to 5.8. The listings moved with it, renamed `ch05_paths.py` and `ch05-step0-graph-owners-roles-memberships.ps1`. Added the opening story ("The export that showed nothing") on 2026-10-12; it uses only the payments baseline from Chapter 4 and Appendix A. Cross-references across the book were renumbered, and the notes below use the new numbers.
- 2026-10-12 (BR-10, repetition edit): recap and signpost references to other chapters were cut or turned into section pointers, and the **Builds on** line now carries the dependencies. No technical content, code, labs, or evidence categories changed. `tools/check_cross_refs.py` checks every reference.
- 2026-10-12 (sources): added 34 sources. Changed: Step 0's deny listing was a Resource Graph query on a type the table reference doesn't list [S7]; it's now `appb-deny-assignments.ps1`, a REST call with the same columns [S8]. The deny fields question in the 2026-10-11 note is answered by the REST reference, not Resource Graph. Softened: none. Unverified: managed-identity attach permissions and Function App publish action (existing Verify note); Conditional Access blocking managed identities (contract row only).
- Verify Step 0 cmdlets and payload shapes: `Get-MgApplicationOwner`, `Get-MgRoleManagementDirectoryRoleAssignment`, `Get-MgRoleManagementDirectoryRoleDefinition`, `Get-MgGroupTransitiveMember`; directory role template ids; `identity.userAssignedIdentities` principalId; deny assignment `principals` and `doNotApplyToChildScopes`; management group `properties.details.parent.id`.
- Built-in directory role template ids used as a sanity check on `directory-role-assignments.json` (verified 2026-10-10): Cloud Application Administrator `158c047a-c907-4556-b7ef-446551a6b5f7`, Application Administrator `9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3`, Global Administrator `62e90394-69f5-4237-9190-012177145e10`.
- Consider a figure for section 5.5's payments graph instead of ASCII.
- 2026-10-11 (review comment on unmodeled controls): the derivation no longer skips conditioned assignments. Conditions, missing role definitions, and conditioned denies now produce labeled edges, a path through one is "Insufficient evidence", and deny `excludePrincipals` is honored. Added `path_verdict`, the access-decision contract in section 5.6, and optional Step 3a. Tests in `test_ch04_paths.py` cover each case and confirm the plain lab still yields exactly P1 to P6. Verify before submission: the deny assignment `condition`, `conditionVersion`, `excludePrincipals`, and permission-level `condition` fields in Resource Graph rows (REST api-version 2022-04-01 documents them); and the scope of Conditional Access for workload identities (single-tenant service principals; managed identities not covered) before adding detail to the contract row.
- 2026-10-12 (review comment on temporal consistency): added "Paths across time" with the `input_span` listing. `KIND_SOURCES` and `parse_utc` moved here from Chapter 12, which now imports them. `hop_table` takes the temporal reason. The threshold has no default number: it is the reader's own normal run length, for the reason given in the text. Added the Setup note, Step 0 saving through `Save-SnapshotFile`, the Step 2 call, and optional Step 3b. Tests in `test_ch04_paths.py` (`InputSpans`) cover a one-run path, a later-run input, a change inside and outside the span, and untimed inputs.
- 2026-10-12 (network ladder): `find_paths` now walks `canReach` edges (it didn't, so Chapter 7 Step 7 couldn't work), and `UnmodeledControl` has a fourth kind, `networkIndeterminate`, produced by Chapter 7's `reach_edge`. Added `canReach` to the section 5.2 edge table.
- Add the Chapter 5 fact checks to GTM **M-306** when it is picked up.
