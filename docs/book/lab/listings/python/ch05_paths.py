"""Chapter 5 listings: capability-edge derivation and path search.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch05_paths.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


# region identity_graph
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
# endregion identity_graph


# region path_verdict
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
# endregion path_verdict


# region input_span
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
# endregion input_span
