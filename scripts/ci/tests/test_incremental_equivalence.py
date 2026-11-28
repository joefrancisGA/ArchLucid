"""Offline FND-086 negative-dependency and shadow-gate controls."""

import copy
import json
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from test_paired_engine_evaluation import ROOT

import verify_incremental_equivalence as verification


def edge(key, source, target, requires=()):
    return {"id": key, "from": source, "to": target, "requires": list(requires)}


def domain(name="world", vertices=("a", "b", "c", "d"), edges=(), controls=(), complete=True):
    return {"id": name, "complete": complete, "vertices": list(vertices), "edges": list(edges),
            "enabledControls": list(controls)}


def query(key="probe", name="world", source="a", target="d"):
    return {"id": key, "domain": name, "from": source, "to": target}


def world(before=None, after=None, *, queries=None, product="SecureNow"):
    start = {"captureId": "snapshot-a", "scopeId": "synthetic-scope", "captureVersion": "capture-1",
             "collectorVersion": "collector-1", "engineRevision": "a" * 40, "policyVersion": "policy-1",
             "configurationVersion": "settings-1", "collectionComplete": True,
             "domains": [domain()] if before is None else before}
    end = {**copy.deepcopy(start), "captureId": "snapshot-b",
           "domains": [domain()] if after is None else after}
    return {"schemaVersion": 1, "dataClass": "reviewed_synthetic", "product": product,
            "caseId": "lineage-control", "before": start, "after": end,
            "queries": [query()] if queries is None else queries}


def run(case, observations=None):
    return verification.verify_shadow(case, verification.digest(case), observations,
                                      verification.digest(observations) if observations is not None else None)


def fixture_receipts(case, full, incremental):
    left, right, queries = verification.load_case(case, verification.digest(case))
    _, plan = verification.pair_documents(case, left, right, queries)
    return {role: verification.receipt(plan, role, {"probe": value}, right, queries)
            for role, value in (("baseline", full), ("candidate", incremental))}


class NegativeDependencyCases(unittest.TestCase):
    def test_new_resource_and_path_discover_a_previously_absent_endpoint_in_both_products(self):
        chain = [edge("ab", "a", "b"), edge("bc", "b", "c"), edge("cd", "c", "d")]
        for product in ("SecureNow", "ArchLucid"):
            with self.subTest(product=product):
                case = world([domain(vertices=("a", "b", "c"), edges=chain[:2])],
                             [domain(edges=chain)], product=product)
                result = run(case)
                row, = result["queries"]
                self.assertEqual(result["status"], "shadow_pass")
                self.assertFalse(result["rolloutAuthorized"])
                self.assertEqual(row["action"], "recompute_complete_domain")
                self.assertEqual(row["changedDependencies"], ["vertices_added", "edges_added"])
                self.assertIs(row["reference"], True)
                self.assertIs(row["full"], True)
                self.assertIs(row["incremental"], True)
                self.assertNotEqual(row["priorDomainSha256"], row["targetDomainSha256"])

    def test_no_change_reuses_both_absence_and_presence(self):
        chains = [(), (edge("ad", "a", "d"),)]
        for edges, reachable in zip(chains, (False, True)):
            with self.subTest(reachable=reachable):
                row, = run(world([domain(edges=edges)], [domain(edges=edges)]))["queries"]
                self.assertEqual(row["action"], "reuse_exact_complete_domain")
                self.assertEqual(row["changedDependencies"], [])
                self.assertEqual(row["priorDomainSha256"], row["targetDomainSha256"])
                self.assertIs(row["incremental"], reachable)

    def test_exact_reuse_never_walks_the_target_incrementally(self):
        with patch.object(verification, "walk", wraps=verification.walk) as calls:
            report = run(world())
        self.assertEqual(report["queries"][0]["action"], "reuse_exact_complete_domain")
        self.assertEqual([call.args[0]["captureId"] for call in calls.call_args_list], ["snapshot-a", "snapshot-b"])

    def test_checked_in_example_requires_discovering_newly_reachable_endpoint(self):
        path = ROOT / "scripts" / "assurance" / "regression-evidence" / "fnd086-new-path.json"
        case = verification.paired.read(path)
        report = verification.verify_shadow(case, "ef0bdc7ff764bb849d56deb140811adfafe1e189aca5ec5a6740ec12b1a11843")
        self.assertIs(report["queries"][0]["incremental"], True)
        self.assertIn("vertices_added", report["queries"][0]["changedDependencies"])

    def test_incomplete_target_does_not_carry_forward_a_previous_negative(self):
        case = world(after=[domain(complete=False)])
        result = run(case)
        self.assertEqual(result["status"], "block_insufficient")
        row, = result["queries"]
        self.assertEqual(row["action"], "target_incomplete")
        self.assertEqual(row["status"], "inconclusive")
        self.assertIsNone(row["incremental"])
        self.assertIsNone(row["full"])
        self.assertIsNone(row["reference"])

    def test_incomplete_prior_forces_recomputation_into_a_complete_capture(self):
        case = world([domain(complete=False)], [domain(edges=[edge("ad", "a", "d")])])
        row, = run(case)["queries"]
        self.assertFalse(row["priorComplete"])
        self.assertEqual(row["action"], "recompute_complete_domain")
        self.assertTrue(row["incremental"])

    def test_scope_wide_incompleteness_and_missing_domains_are_not_complete_absence(self):
        missing = world(after=[])
        partial = world()
        partial["after"]["collectionComplete"] = False
        self.assertEqual(run(missing)["status"], "block_insufficient")
        self.assertEqual(run(partial)["status"], "block_insufficient")

    def test_indirect_addition_invalidates_a_negative_without_touching_old_reachable_vertices(self):
        initial = [edge("ab", "a", "b"), edge("cd", "c", "d")]
        revised = [*initial, edge("bc", "b", "c")]
        result = run(world([domain(edges=initial)], [domain(edges=revised)]))
        row, = result["queries"]
        self.assertEqual(row["changedDependencies"], ["edges_added"])
        self.assertIs(row["incremental"], True)
        self.assertEqual(row["action"], "recompute_complete_domain")

    def test_deletion_with_and_without_alternate_path_recomputes(self):
        old = [edge("ab", "a", "b"), edge("bd", "b", "d"), edge("ac", "a", "c"), edge("cd", "c", "d")]
        for remaining, expected in ((old[1:], True), (old[:1], False)):
            with self.subTest(expected=expected):
                row, = run(world([domain(edges=old)], [domain(edges=remaining)]))["queries"]
                self.assertEqual(row["changedDependencies"], ["edges_removed"])
                self.assertEqual(row["action"], "recompute_complete_domain")
                self.assertIs(row["incremental"], expected)

    def test_changed_permission_or_identity_controls_affect_the_same_edge_inventory(self):
        for control in ("network-policy", "identity-policy"):
            with self.subTest(control=control):
                join = edge("ad", "a", "d", [control])
                before, after = [domain(edges=[join])], [domain(edges=[join], controls=[control])]
                row, = run(world(before, after))["queries"]
                self.assertEqual(row["changedDependencies"], ["control_state_changed"])
                self.assertEqual(row["action"], "recompute_complete_domain")
                self.assertIs(row["incremental"], True)

    def test_reused_edge_identifier_does_not_hide_a_semantic_change(self):
        before = [domain(edges=[edge("line", "a", "b")])]
        after = [domain(edges=[edge("line", "a", "d")])]
        row, = run(world(before, after))["queries"]
        self.assertIn("edges_changed", row["changedDependencies"])
        self.assertIs(row["incremental"], True)

    def test_separately_complete_domain_can_reuse_when_another_domain_changes(self):
        old = [domain("unstable"), domain("stable")]
        new = [domain("unstable", edges=[edge("ad", "a", "d")]), domain("stable")]
        result = run(world(old, new, queries=[query("p", "unstable"), query("q", "stable")]))
        self.assertEqual([row["action"] for row in result["queries"]],
                         ["recompute_complete_domain", "reuse_exact_complete_domain"])
        self.assertEqual([row["incremental"] for row in result["queries"]], [True, False])

    def test_reordered_inputs_are_equivalent_but_version_changes_are_not_reusable(self):
        edges = [edge("ab", "a", "b", ("c1", "c2")), edge("bd", "b", "d")]
        reordered = [copy.deepcopy(edges[1]), copy.deepcopy(edges[0])]
        reordered[1]["requires"].reverse()
        case = world([domain(edges=edges, controls=("c1", "c2"))],
                     [domain(vertices=("d", "b", "c", "a"), edges=reordered, controls=("c2", "c1"))])
        self.assertEqual(run(case)["queries"][0]["action"], "reuse_exact_complete_domain")
        for key in ("captureVersion", "collectorVersion", "engineRevision", "policyVersion", "configurationVersion"):
            different = copy.deepcopy(case)
            different["after"][key] = "b" * 40 if key == "engineRevision" else "other"
            result = run(different)
            self.assertEqual(result["queries"][0]["changedDependencies"], [key])
            self.assertEqual(result["queries"][0]["action"], "recompute_complete_domain")

    def test_bad_scope_pin_ambiguous_edges_and_non_synthetic_inputs_fail_closed(self):
        case = world()
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            verification.verify_shadow(case, "0" * 64)
        case["after"]["scopeId"] = "different-scope"
        with self.assertRaisesRegex(ValueError, "cross-scope"):
            run(case)
        case["after"]["scopeId"] = case["before"]["scopeId"]
        case["after"]["domains"][0]["edges"] = [edge("outside", "a", "z")]
        with self.assertRaisesRegex(ValueError, "endpoint outside"):
            run(case)
        case["dataClass"] = "unreviewed"
        with self.assertRaisesRegex(ValueError, "synthetic"):
            run(case)

    def test_bounded_reference_matches_separate_walk_across_generated_synthetic_cases(self):
        generator = random.Random(86)
        vertices = ("a", "b", "c", "d", "e")
        for _ in range(30):
            edges = [edge(f"r{i}", generator.choice(vertices), generator.choice(vertices), ("enabled",) if i % 2 else ())
                     for i in range(12)]
            queries = [query(f"q{i}-{j}", source=src, target=dst)
                       for i, src in enumerate(vertices) for j, dst in enumerate(vertices)]
            case = world([domain(vertices=vertices)], [domain(vertices=vertices, edges=edges)], queries=queries)
            self.assertEqual(run(case)["status"], "shadow_pass")


class ShadowReceiptCases(unittest.TestCase):
    def setUp(self):
        self.case = world(after=[domain(edges=[edge("ad", "a", "d")])])

    def test_different_results_block_even_with_matching_input_pins(self):
        result = run(self.case, fixture_receipts(self.case, True, False))
        self.assertEqual(result["status"], "block_mismatch")
        self.assertEqual(result["receiptOrigin"], "pinned_synthetic_receipt_replay")

    def test_two_engines_agreeing_on_a_miss_are_still_wrong(self):
        result = run(self.case, fixture_receipts(self.case, False, False))
        self.assertEqual(result["status"], "block_mismatch")
        self.assertFalse(result["queries"][0]["full"])
        self.assertFalse(result["queries"][0]["incremental"])
        self.assertTrue(result["queries"][0]["reference"])

    def test_missing_scope_is_inconclusive_and_incomplete_capture_cannot_be_certified(self):
        self.assertEqual(run(self.case, fixture_receipts(self.case, True, None))["status"], "block_insufficient")
        self.case["after"]["domains"][0]["complete"] = False
        self.assertEqual(run(self.case, fixture_receipts(self.case, False, False))["status"], "block_mismatch")

    def test_wrong_receipt_scope_provenance_or_input_never_authorizes_rollout(self):
        records = fixture_receipts(self.case, True, True)
        fake = records["candidate"]["findings"][0]
        fake["provenance"] = ["0" * 64]
        self.assertEqual(run(self.case, records)["status"], "block_mismatch")
        records["candidate"]["fixtureSha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "exact shared input"):
            run(self.case, records)

    def test_cli_writes_machine_readable_gate_and_exits_nonzero_for_insufficient(self):
        script = ROOT / "scripts" / "assurance" / "verify_incremental_equivalence.py"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "snapshot-pair.json"

            def cli(case, *args):
                path.write_text(json.dumps(case), encoding="utf-8")
                return subprocess.run([sys.executable, str(script), "--case", str(path),
                                       "--case-sha256", verification.digest(case), *args], capture_output=True, text=True)

            good = cli(self.case)
            self.assertEqual(good.returncode, 0, good.stderr)
            self.assertFalse(json.loads(good.stdout)["rolloutAuthorized"])
            prepared = cli(self.case, "--prepare")
            self.assertEqual(prepared.returncode, 0, prepared.stderr)
            self.assertEqual(json.loads(prepared.stdout)["plan"]["fixtureSha256"], json.loads(good.stdout)["fixtureSha256"])
            self.case["after"]["collectionComplete"] = False
            blocked = cli(self.case)
            self.assertEqual(blocked.returncode, 1, blocked.stderr)
            self.assertEqual(json.loads(blocked.stdout)["status"], "block_insufficient")


if __name__ == "__main__":
    unittest.main()
