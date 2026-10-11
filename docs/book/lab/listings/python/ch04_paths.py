"""Chapter 4 listings: capability-edge derivation and path search.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch04_paths.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations


# region identity_graph
from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    kind: str
    evidence: str   # "observed", "derived", "inference", "ai", "human"
    detail: str     # citation: snapshot file and row, or rule name


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
})

# Observed structure. Kept for citation and as derivation input. Not a capability.
STRUCTURAL_KINDS = frozenset({"hasRoleAt", "contains"})

# Representative actions for the payments lab. A wildcard such as
# Microsoft.Web/sites/* covers the first; Reader's */read covers neither.
CODE_CONTROL_ACTION = "Microsoft.Web/sites/write"
LIST_KEYS_ACTION = "Microsoft.Storage/storageAccounts/listKeys/action"
BLOB_READ_ACTION = "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read"


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


def _granting_citation(blocks: list[tuple[list[dict], str]], action: str, plane: str) -> str | None:
    for permissions, citation in blocks:
        if action_permitted(permissions, action, plane):
            return citation

    return None


def _folded_children(children_of: dict[str, list[str]]) -> dict[str, list[str]]:
    folded: dict[str, list[str]] = {}

    for parent, children in children_of.items():
        bucket = folded.setdefault(scope_key(parent), [])

        for child in children:
            child_key = scope_key(child)

            if child_key not in bucket:
                bucket.append(child_key)

    return folded


def _deny_hits(
    denies: list[dict],
    children_of: dict[str, list[str]],
    principal: str,
    scope: str,
    action: str,
    plane: str,
) -> bool:
    principal_key = principal.lower()

    for deny in denies:
        principals = deny.get("principals") or []
        principal_keys = {item.lower() for item in principals}

        if principal_key not in principal_keys and "*" not in principals:
            continue

        deny_scope = scope_key(deny["scope"])
        deny_scopes = [deny_scope]

        if deny.get("apply_to_children", True):
            deny_scopes.extend(descendants_of(children_of, deny_scope))

        if scope not in deny_scopes:
            continue

        if action_permitted(deny["permissions"], action, plane):
            return True

    return False


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
    denies: principals ('*' means all), scope, apply_to_children, permissions, in the same
    shape as a role.
    resources: id, scope, type ('compute' or 'storage'), and for storage a shared_key of
    'enabled', 'not set', or 'disabled', plus capability (the grants target).

    A non-empty condition is not evaluated here. Emitting an edge for it would invent a path.
    """
    grants_at: dict[tuple[str, str], list[tuple[list[dict], str]]] = {}
    children_of = _folded_children(children_of)

    for assignment in assignments:
        condition = (assignment.get("condition") or "").strip()

        if condition:
            continue

        role = role_definitions.get(assignment["role_name"])

        if role is None:
            continue

        assignment_scope = scope_key(assignment["scope"])
        scopes = [assignment_scope, *descendants_of(children_of, assignment_scope)]

        for scope in scopes:
            key = (assignment["principal"], scope)
            grants_at.setdefault(key, []).append((role["permissions"], assignment["citation"]))

    pending: dict[tuple[str, str, str], str] = {}

    def remember(source: str, target: str, kind: str, detail: str) -> None:
        pending.setdefault((source, target, kind), detail)

    for resource in resources:
        scope = scope_key(resource["scope"])

        for (principal, granted_scope), blocks in grants_at.items():
            if granted_scope != scope:
                continue

            if resource["type"] == "compute":
                citation = _granting_citation(blocks, CODE_CONTROL_ACTION, "control")
                denied = _deny_hits(
                    denies, children_of, principal, scope, CODE_CONTROL_ACTION, "control"
                )

                if citation and not denied:
                    remember(
                        principal,
                        resource["id"],
                        "canControlCode",
                        f"{citation}; {CODE_CONTROL_ACTION}",
                    )

            if resource["type"] != "storage":
                continue

            hit_notes: list[str] = []
            hit_citation: str | None = None
            shared_key = resource.get("shared_key")

            if shared_key in ("enabled", "not set", "not set (platform default)"):
                keys_citation = _granting_citation(blocks, LIST_KEYS_ACTION, "control")
                keys_denied = _deny_hits(
                    denies, children_of, principal, scope, LIST_KEYS_ACTION, "control"
                )

                if keys_citation and not keys_denied:
                    qualifier = (
                        "platform default assumed enabled"
                        if shared_key in ("not set", "not set (platform default)")
                        else "enabled"
                    )
                    hit_notes.append(f"{LIST_KEYS_ACTION} ({qualifier})")
                    hit_citation = keys_citation

            blob_citation = _granting_citation(blocks, BLOB_READ_ACTION, "data")
            blob_denied = _deny_hits(
                denies, children_of, principal, scope, BLOB_READ_ACTION, "data"
            )

            if blob_citation and not blob_denied:
                hit_notes.append(BLOB_READ_ACTION)

                if hit_citation is None:
                    hit_citation = blob_citation

            if hit_notes and hit_citation is not None:
                remember(
                    principal,
                    resource["capability"],
                    "grants",
                    f"{hit_citation}; {'; '.join(hit_notes)}",
                )

    return [
        Edge(source=source, target=target, kind=kind, evidence="derived", detail=detail)
        for (source, target, kind), detail in pending.items()
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
