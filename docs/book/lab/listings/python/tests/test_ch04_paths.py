"""Chapter 4: the identity graph finds exactly the lab's six paths (Appendix A.3)."""

from __future__ import annotations

import unittest

import lab_graph as lab
from ch04_paths import (
    BLOB_READ_ACTION,
    CODE_CONTROL_ACTION,
    LIST_KEYS_ACTION,
    Edge,
    action_permitted,
    derive_capability_edges,
    descendants_of,
    expand_group_assignments,
    find_paths,
    pattern_covers,
)


class LabKnownAnswers(unittest.TestCase):
    def test_six_paths_three_entries_two_targets(self) -> None:
        found = lab.labeled_paths(lab.lab_edges())

        self.assertEqual({label: len(paths) for label, paths in found.items()},
                         {label: 1 for label in lab.BOOK_PATHS})

    def test_hop_counts_match_chapter_9_ranking(self) -> None:
        found = lab.labeled_paths(lab.lab_edges())
        hops = {label: len(paths[0]) for label, paths in found.items()}

        self.assertEqual(hops, {"P1": 3, "P2": 3, "P3": 3, "P4": 5, "P5": 5, "P6": 5})

    def test_every_path_passes_through_payments_deploy(self) -> None:
        found = lab.labeled_paths(lab.lab_edges())

        for label, paths in found.items():
            with self.subTest(label):
                self.assertIn(lab.SP, {edge.source for edge in paths[0]})

    def test_analyst_reader_adds_no_path(self) -> None:
        edges = lab.lab_edges()

        for target in lab.TARGETS:
            with self.subTest(target):
                self.assertEqual(find_paths(edges, lab.ANALYST, target), [])

    def test_payments_api_identity_is_reachable_from_no_entry(self) -> None:
        edges = lab.lab_edges()
        sources_into_api = [edge for edge in edges if edge.target == lab.MI_API]

        self.assertIn(lab.MI_API, {edge.source for edge in edges})
        self.assertEqual(sources_into_api, [])

    def test_archive_in_payments_group_would_add_three_key_paths(self) -> None:
        # The lab bug Appendix A now explains: Contributor on the group could list custarchive's keys.
        found = lab.labeled_paths(lab.lab_edges(archive_in_prod=True))

        self.assertEqual(sum(len(paths) for paths in found.values()), 9)
        self.assertEqual(len(found["P4"]), 2)


class PatternCovers(unittest.TestCase):
    def test_exact_match_is_case_insensitive(self) -> None:
        self.assertTrue(pattern_covers(["microsoft.web/SITES/write"], CODE_CONTROL_ACTION))

    def test_exact_mismatch(self) -> None:
        self.assertFalse(pattern_covers(["Microsoft.Web/sites/read"], CODE_CONTROL_ACTION))

    def test_star_matches_everything(self) -> None:
        self.assertTrue(pattern_covers(["*"], LIST_KEYS_ACTION))

    def test_star_read_covers_reads_only(self) -> None:
        self.assertTrue(pattern_covers(["*/read"], "Microsoft.Storage/storageAccounts/read"))
        self.assertFalse(pattern_covers(["*/read"], LIST_KEYS_ACTION))

    def test_trailing_wildcard(self) -> None:
        self.assertTrue(pattern_covers(["Microsoft.Web/sites/*"], CODE_CONTROL_ACTION))

    def test_prefix_must_match(self) -> None:
        self.assertFalse(pattern_covers(["Microsoft.Storage/*"], CODE_CONTROL_ACTION))

    def test_middle_wildcard(self) -> None:
        self.assertTrue(pattern_covers(["Microsoft.Authorization/*/Write"],
                                       "Microsoft.Authorization/roleAssignments/write"))
        self.assertFalse(pattern_covers(["Microsoft.Authorization/*/Write"],
                                        "Microsoft.Authorization/roleAssignments/read"))

    def test_middle_piece_missing(self) -> None:
        self.assertFalse(pattern_covers(["Microsoft.*/blobServices/*"], CODE_CONTROL_ACTION))

    def test_middle_piece_present(self) -> None:
        self.assertTrue(pattern_covers(["Microsoft.*/blobServices/*"], BLOB_READ_ACTION))

    def test_tail_cannot_overlap_prefix(self) -> None:
        self.assertFalse(pattern_covers(["ab*ba"], "aba"))


class ActionPermitted(unittest.TestCase):
    def test_not_actions_remove_inside_their_block(self) -> None:
        blocks = [{"actions": ["*"], "not_actions": ["Microsoft.Web/*"]}]

        self.assertFalse(action_permitted(blocks, CODE_CONTROL_ACTION, "control"))

    def test_another_block_can_still_grant(self) -> None:
        blocks = [
            {"actions": ["*"], "not_actions": ["Microsoft.Web/*"]},
            {"actions": [CODE_CONTROL_ACTION]},
        ]

        self.assertTrue(action_permitted(blocks, CODE_CONTROL_ACTION, "control"))

    def test_data_plane_uses_data_actions(self) -> None:
        blocks = [{"actions": ["*"], "data_actions": [], "not_data_actions": []}]

        self.assertFalse(action_permitted(blocks, BLOB_READ_ACTION, "data"))


class Scopes(unittest.TestCase):
    def test_descendants_are_nested_and_deduplicated(self) -> None:
        children = {"a": ["b", "c"], "b": ["d"], "c": ["d"]}

        self.assertEqual(sorted(descendants_of(children, "a")), ["b", "c", "d"])

    def test_descendants_of_leaf(self) -> None:
        self.assertEqual(descendants_of({}, "leaf"), [])


class GroupExpansion(unittest.TestCase):
    def test_members_receive_copies_with_citation(self) -> None:
        group = {"principal": "group:ops", "role_name": "Reader", "scope": "/s", "citation": "row 1"}
        expanded = expand_group_assignments([group], {"group:ops": ["user:a"]})

        self.assertEqual(len(expanded), 2)
        self.assertEqual(expanded[1]["principal"], "user:a")
        self.assertEqual(expanded[1]["citation"], "row 1; memberOf group:ops")
        self.assertEqual(group["principal"], "group:ops")


class Derivation(unittest.TestCase):
    def derive(self, assignments: list[dict], denies: list[dict] | None = None,
               shared_key: str = "enabled") -> list[Edge]:
        return derive_capability_edges(
            assignments, lab.ROLE_DEFINITIONS, lab.CHILDREN_OF, denies or [],
            lab.resources(shared_key),
        )

    def contributor(self, scope: str = lab.RG_PROD, condition: str = "") -> dict:
        return {"principal": "sp:x", "role_name": "Contributor", "scope": scope,
                "condition": condition, "citation": "row 1"}

    def test_contributor_on_group_controls_code_and_lists_keys(self) -> None:
        edges = self.derive([self.contributor()])
        kinds = {(edge.target, edge.kind) for edge in edges}

        self.assertEqual(kinds, {(lab.PAY_RECONCILE, "canControlCode"), (lab.READ_CUSTDATA, "grants")})
        self.assertTrue(all(edge.evidence == "derived" for edge in edges))

    def test_scope_ids_fold_case(self) -> None:
        edges = self.derive([self.contributor(scope=lab.RG_PROD.upper())])

        self.assertEqual(len(edges), 2)

    def test_conditional_assignment_emits_nothing(self) -> None:
        self.assertEqual(self.derive([self.contributor(condition="@Resource[name] == 'x'")]), [])

    def test_unknown_role_emits_nothing(self) -> None:
        assignment = dict(self.contributor(), role_name="Mystery")

        self.assertEqual(self.derive([assignment]), [])

    def test_disabled_shared_key_blocks_key_route(self) -> None:
        edges = self.derive([self.contributor()], shared_key="disabled")

        self.assertNotIn(lab.READ_CUSTDATA, {edge.target for edge in edges})

    def test_unset_shared_key_assumes_platform_default(self) -> None:
        edges = self.derive([self.contributor()], shared_key="not set")
        grants = [edge for edge in edges if edge.kind == "grants"]

        self.assertIn("platform default assumed enabled", grants[0].detail)

    def test_deny_assignment_on_parent_blocks_children(self) -> None:
        deny = {"principals": ["*"], "scope": lab.RG_PROD,
                "permissions": [{"actions": ["*"]}]}

        self.assertEqual(self.derive([self.contributor()], [deny]), [])

    def test_deny_without_children_spares_resources(self) -> None:
        deny = {"principals": ["SP:X"], "scope": lab.RG_PROD, "apply_to_children": False,
                "permissions": [{"actions": ["*"]}]}

        self.assertEqual(len(self.derive([self.contributor()], [deny])), 2)

    def test_deny_for_someone_else_is_ignored(self) -> None:
        deny = {"principals": ["sp:other"], "scope": lab.RG_PROD,
                "permissions": [{"actions": ["*"]}]}

        self.assertEqual(len(self.derive([self.contributor()], [deny])), 2)

    def test_data_reader_grants_with_its_own_citation(self) -> None:
        reader = {"principal": "mi:x", "role_name": "Storage Blob Data Reader", "scope": lab.CUSTDATA,
                  "citation": "row 9"}
        edges = self.derive([reader])

        self.assertEqual([(edge.target, edge.detail) for edge in edges],
                         [(lab.READ_CUSTDATA, f"row 9; {BLOB_READ_ACTION}")])

    def test_children_differing_only_in_case_fold_together(self) -> None:
        children = {lab.RG_PROD: [lab.CUSTDATA, lab.CUSTDATA.upper()]}
        edges = derive_capability_edges([self.contributor()], lab.ROLE_DEFINITIONS, children, [],
                                        lab.resources())

        self.assertEqual([edge.target for edge in edges], [lab.READ_CUSTDATA])

    def test_key_route_and_blob_read_both_cited(self) -> None:
        owner = {"permissions": [{"actions": ["*"], "data_actions": ["*"]}]}
        edges = derive_capability_edges(
            [{"principal": "sp:x", "role_name": "Owner-like", "scope": lab.CUSTDATA, "citation": "row 4"}],
            {"Owner-like": owner}, lab.CHILDREN_OF, [], lab.resources(),
        )

        self.assertEqual(edges[0].detail, f"row 4; {LIST_KEYS_ACTION} (enabled); {BLOB_READ_ACTION}")

    def test_data_action_denied(self) -> None:
        reader = {"principal": "mi:x", "role_name": "Storage Blob Data Reader", "scope": lab.CUSTDATA,
                  "citation": "row 9"}
        deny = {"principals": ["mi:x"], "scope": lab.CUSTDATA,
                "permissions": [{"data_actions": ["*"]}]}

        self.assertEqual(self.derive([reader], [deny]), [])


class FindPaths(unittest.TestCase):
    def test_unknown_kind_raises(self) -> None:
        with self.assertRaises(ValueError):
            find_paths([Edge("a", "b", "teleportsTo", "ai", "")], "a", "b")

    def test_cycles_terminate(self) -> None:
        edges = [
            Edge("a", "b", "memberOf", "observed", ""),
            Edge("b", "a", "memberOf", "observed", ""),
            Edge("b", "c", "grants", "derived", ""),
        ]

        self.assertEqual(len(find_paths(edges, "a", "c")), 1)

    def test_hop_limit(self) -> None:
        edges = [Edge(str(n), str(n + 1), "memberOf", "observed", "") for n in range(5)]

        self.assertEqual(find_paths(edges, "0", "5", max_hops=4), [])
        self.assertEqual(len(find_paths(edges, "0", "5", max_hops=5)), 1)

    def test_shortest_first(self) -> None:
        edges = [
            Edge("a", "t", "grants", "derived", ""),
            Edge("a", "b", "memberOf", "observed", ""),
            Edge("b", "t", "grants", "derived", ""),
        ]

        self.assertEqual([len(path) for path in find_paths(edges, "a", "t")], [1, 2])


if __name__ == "__main__":
    unittest.main()
