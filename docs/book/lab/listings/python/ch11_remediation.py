"""Chapter 11 listings: ranking, cut sets, verification, and recommendation IDs.

Each region between `# region <name>` and `# endregion <name>` appears verbatim in the book under a
`<!-- listing: lab/listings/python/ch11_remediation.py#<name> -->` marker. Edit the code here, then copy the
region into the book; docs/book/tools/check_listings.py fails when the two differ.
"""

from __future__ import annotations

from ch05_paths import STRUCTURAL_KINDS, Edge, find_paths


# region rank_key
RULESET_VERSION = "contoso-path-ranking-2026-10-01"

CONSEQUENCE = {"customer data": 0, "production control": 0, "internal data": 1, "low value": 2}
EXPOSURE = {"internet": 0, "any tenant user": 1, "specific identity": 2, "privileged admin": 3}
REACH = {"internet": 0, "azure": 1, "internal": 2}
CONFIDENCE = {"High": 0, "Medium": 1, "Low": 2}


def rank_key(path: dict) -> tuple[int, int, int, int, int]:
    """Lower sorts first. Unknown levels raise KeyError instead of being guessed."""
    return (
        CONSEQUENCE[path["consequence"]],
        EXPOSURE[path["exposure"]],
        REACH[path["reach"]],
        CONFIDENCE[path["confidence"]],
        len(path["hops"]),
    )
# endregion rank_key


# region greedy_plan
from dataclasses import dataclass


def edge_key(edge: Edge) -> tuple[str, str, str]:
    return (edge.source, edge.kind, edge.target)


@dataclass(frozen=True)
class Change:
    name: str
    # Edge keys this change eliminates.
    removes: frozenset[tuple[str, str, str]]
    # Ordinal tier used only for comparison: 1 low, 2 medium, 3 high.
    cost: int
    # True if it breaks a confirmed flow or required function.
    removes_required: bool = False
    # Nodes that could undo the change.
    reversible_by: frozenset[str] = frozenset()


def greedy_plan(
    paths: list[list[Edge]], changes: list[Change]
) -> tuple[list[Change], list[list[Edge]]]:
    """Choose changes that close the most paths per unit of cost.

    Returns (plan, paths left open).
    """
    remaining = list(paths)
    allowed = [change for change in changes if not change.removes_required]
    plan: list[Change] = []

    def closes(change: Change) -> int:
        return sum(1 for path in remaining if any(edge_key(e) in change.removes for e in path))

    while remaining:
        useful = [change for change in allowed if change not in plan and closes(change) > 0]

        if not useful:
            break

        # Most paths closed per cost tier; then cheaper; then name, so ties are deterministic.
        best = max(useful, key=lambda c: (closes(c) / c.cost, -c.cost, c.name))
        plan.append(best)
        remaining = [
            path for path in remaining if not any(edge_key(e) in best.removes for e in path)
        ]

    return plan, remaining
# endregion greedy_plan


# region open_paths_after
def open_paths_after(
    edges: list[Edge], plan: list[Change], entries: list[str], targets: list[str]
) -> dict:
    """Re-run the Chapter 5 search with the plan's edges removed."""
    removed = set().union(*(change.removes for change in plan)) if plan else set()
    kept = [edge for edge in edges if edge_key(edge) not in removed]
    results = {}

    for entry in entries:
        for target in targets:
            found = find_paths(kept, entry, target, max_hops=12)

            if found:
                results[(entry, target)] = found

    return results
# endregion open_paths_after


# region undoable_changes
def reachable_nodes(edges: list[Edge], entries: list[str]) -> set[str]:
    """Every node reachable from the entry points over traversable edges."""
    outgoing: dict[str, list[str]] = {}

    for edge in edges:
        if edge.kind not in STRUCTURAL_KINDS:
            outgoing.setdefault(edge.source, []).append(edge.target)

    seen = set(entries)
    frontier = list(entries)

    while frontier:
        node = frontier.pop()

        for target in outgoing.get(node, []):
            if target not in seen:
                seen.add(target)
                frontier.append(target)

    return seen


def undoable_changes(edges: list[Edge], plan: list[Change], entries: list[str]) -> list[str]:
    """Names of planned changes that an identity still reachable after the plan could reverse."""
    removed = set().union(*(change.removes for change in plan)) if plan else set()
    kept = [edge for edge in edges if edge_key(edge) not in removed]
    reach = reachable_nodes(kept, entries)

    return [change.name for change in plan if change.reversible_by & reach]
# endregion undoable_changes


# region recommendation_id
import hashlib


def recommendation_id(change_names: list[str], path_endpoints: list[tuple[str, str]]) -> str:
    """Same changes for the same entry/target pairs give the same ID, run after run."""
    endpoints = sorted(f"{a}->{b}" for a, b in path_endpoints)
    material = "|".join(sorted(change_names)) + "#" + "|".join(endpoints)

    return "rec-" + hashlib.sha256(material.encode("utf-8")).hexdigest()[:8]
# endregion recommendation_id
