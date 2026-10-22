"""Chapter 11: ranking, the greedy plan from section 11.3, verification, and durability."""

from __future__ import annotations

import unittest

import lab_graph as lab
from ch05_paths import Edge
from ch11_remediation import (
    Change,
    edge_key,
    greedy_plan,
    open_paths_after,
    rank_key,
    reachable_nodes,
    recommendation_id,
    undoable_changes,
)

OWNER = "Remove `dev-lead` as app owner"
HELPDESK_ROLE = "Remove Cloud Application Administrator from `helpdesk-07`"
SHARED_KEY = "Disable shared key access on `custdata`"
NARROW = "Narrow `payments-deploy` to deployment roles"


def payments_changes() -> list[Change]:
    """Section 11.3's change table. Costs: low 1, medium 2, high 3."""
    key_route = (lab.SP, "grants", lab.READ_CUSTDATA)

    return [
        Change(OWNER, frozenset({(lab.DEV_LEAD, "canAddCredential", lab.APP)}), 1),
        Change(HELPDESK_ROLE, frozenset({(lab.HELPDESK, "canAddCredential", lab.APP)}), 2),
        Change(SHARED_KEY, frozenset({key_route}), 2, reversible_by=frozenset({lab.SP})),
        Change(NARROW, frozenset({key_route}), 3),
        Change("Remove deploy rights on pay-reconcile",
               frozenset({(lab.SP, "canControlCode", lab.PAY_RECONCILE)}), 1, removes_required=True),
        Change("Remove mi-pay-reconcile's data role",
               frozenset({(lab.MI_RECONCILE, "grants", lab.READ_CUSTARCHIVE)}), 1,
               removes_required=True),
        Change("Remove the federated credential",
               frozenset({(lab.WORKFLOW, "canSignInAs", lab.APP)}), 1, removes_required=True),
    ]


def payments_paths() -> list[list[Edge]]:
    return [paths[0] for paths in lab.labeled_paths(lab.lab_edges()).values()]


class RankKey(unittest.TestCase):
    def test_section_9_2_order(self) -> None:
        rows = {
            "P1": ("customer data", "specific identity", "internet", "Medium", 3),
            "P2": ("customer data", "specific identity", "internet", "High", 3),
            "P3": ("customer data", "specific identity", "internet", "High", 3),
            "P4": ("customer data", "specific identity", "azure", "Medium", 5),
            "P5": ("customer data", "specific identity", "azure", "High", 5),
            "P6": ("customer data", "specific identity", "azure", "High", 5),
        }
        paths = {
            label: {"consequence": c, "exposure": e, "reach": r, "confidence": conf, "hops": [0] * hops}
            for label, (c, e, r, conf, hops) in rows.items()
        }
        ordered = sorted(paths, key=lambda label: rank_key(paths[label]))

        self.assertEqual(ordered, ["P2", "P3", "P1", "P5", "P6", "P4"])
        self.assertEqual(rank_key(paths["P2"]), rank_key(paths["P3"]))

    def test_unknown_level_raises(self) -> None:
        with self.assertRaises(KeyError):
            rank_key({"consequence": "catastrophic", "exposure": "internet", "reach": "internet",
                      "confidence": "High", "hops": []})


class GreedyPlan(unittest.TestCase):
    def test_book_plan_and_p4_left_open(self) -> None:
        plan, remaining = greedy_plan(payments_paths(), payments_changes())

        self.assertEqual([change.name for change in plan], [OWNER, HELPDESK_ROLE, SHARED_KEY])
        self.assertEqual([(path[0].source, path[-1].target) for path in remaining],
                         [lab.BOOK_PATHS["P4"]])

    def test_required_changes_are_never_chosen(self) -> None:
        plan, _ = greedy_plan(payments_paths(), payments_changes())

        self.assertFalse(any(change.removes_required for change in plan))

    def test_no_paths_no_plan(self) -> None:
        self.assertEqual(greedy_plan([], payments_changes()), ([], []))

    def test_doubling_a_cost_can_flip_the_plan(self) -> None:
        changes = [
            Change(c.name, c.removes, 2, c.removes_required, c.reversible_by) if c.name == OWNER else c
            for c in payments_changes()
        ]
        plan, _ = greedy_plan(payments_paths(), changes)

        self.assertEqual(plan[0].name, SHARED_KEY)


class Verification(unittest.TestCase):
    def test_plan_leaves_only_p4_in_the_graph(self) -> None:
        plan, _ = greedy_plan(payments_paths(), payments_changes())
        still_open = open_paths_after(lab.lab_edges(), plan, lab.ENTRIES, lab.TARGETS)

        self.assertEqual(list(still_open), [lab.BOOK_PATHS["P4"]])

    def test_empty_plan_leaves_all_six(self) -> None:
        still_open = open_paths_after(lab.lab_edges(), [], lab.ENTRIES, lab.TARGETS)

        self.assertEqual(sorted(still_open), sorted(lab.BOOK_PATHS.values()))


class Durability(unittest.TestCase):
    def test_section_9_4_flags_the_shared_key_change(self) -> None:
        plan, _ = greedy_plan(payments_paths(), payments_changes())

        self.assertEqual(undoable_changes(lab.lab_edges(), plan, lab.ENTRIES), [SHARED_KEY])

    def test_nothing_to_undo_without_a_plan(self) -> None:
        self.assertEqual(undoable_changes(lab.lab_edges(), [], lab.ENTRIES), [])

    def test_reachability_ignores_structural_edges(self) -> None:
        edges = [Edge("a", "rg", "hasRoleAt", "observed", ""), Edge("a", "b", "memberOf", "observed", "")]

        self.assertEqual(reachable_nodes(edges, ["a"]), {"a", "b"})


class RecommendationId(unittest.TestCase):
    def test_order_does_not_matter(self) -> None:
        first = recommendation_id([OWNER, SHARED_KEY], [("a", "x"), ("b", "y")])
        second = recommendation_id([SHARED_KEY, OWNER], [("b", "y"), ("a", "x")])

        self.assertEqual(first, second)
        self.assertRegex(first, r"^rec-[0-9a-f]{8}$")

    def test_different_endpoints_differ(self) -> None:
        self.assertNotEqual(recommendation_id([OWNER], [("a", "x")]), recommendation_id([OWNER], [("a", "y")]))

    def test_edge_key(self) -> None:
        self.assertEqual(edge_key(Edge("s", "t", "grants", "derived", "row")), ("s", "grants", "t"))


if __name__ == "__main__":
    unittest.main()
