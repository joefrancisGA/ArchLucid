"""Independent contract cases for FND-079 claim verification."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from test_paired_engine_evaluation import (
    ROOT, coverage, finding, fixture, partition, plan_for, receipt,
)

import paired_engine_evaluation as paired
import verify_divergent_findings as check


def report_finding(identity, value, severity="medium", *, family="topology", scope="service-a"):
    row = finding(identity, family=family, scope=scope)
    row["semantics"] = {"assertionId": "distinct-count", "asserted": value, "severity": severity}
    return row


def fact(fact_id, value, *, family="topology", scope="service-a", status="complete"):
    return {"family": family, "scopeKey": scope, "factId": fact_id, "status": status, "value": value,
            "references": ["reviewed-fixture:" + fact_id]}


def oracle(identity, fact_id, *, key=None, op="read_scalar", family="topology", scope="service-a", kind="integer"):
    return {
        "checkId": key or identity, "version": "worked-example/1", "family": family, "scopeKey": scope,
        "identity": identity, "assertionId": "distinct-count", "valueType": kind,
        "oracle": op, "factId": fact_id,
        "source": {"id": "hand-enumerated-test", "revision": "e" * 40, "locator": "worked example A"},
    }


def inputs(*, base=(), candidate=(), facts=(), entries=(), coverage_rows=None, partitions=None, product="ArchLucid"):
    world = fixture(product=product, partitions=partitions)
    world["evidence"] = {"fixture": "independent-inventory", "verificationFacts": list(facts)}
    plan = plan_for(world)
    bank = {"schemaVersion": 1, "fixtureSha256": plan["fixtureSha256"], "checks": list(entries)}
    return (world, plan, receipt(plan, "baseline", base, coverage_rows),
            receipt(plan, "candidate", candidate, coverage_rows), bank)


def run(args, **kwargs):
    return check.verify(*args, paired.sha(paired.canonical(args[-1])), **kwargs)


class VerdictTests(unittest.TestCase):
    def test_independent_counts_catch_false_positive_and_false_negative(self):
        for product in ("ArchLucid", "SecureNow"):
            with self.subTest(product=product):
                args = inputs(
                    product=product,
                    base=[report_finding("missed", 3, "critical"), report_finding("agreed", 2)],
                    candidate=[report_finding("false-positive", 5, "critical"),
                               report_finding("gap", 6), report_finding("no-check", 9),
                               report_finding("agreed", 2)],
                    facts=[fact("reviewed-set", ["one", "two", "two", "three"]),
                           fact("audited-count", 4), fact("partial-count", 6, status="partial")],
                    entries=[oracle("missed", "reviewed-set", op="count_distinct"),
                             oracle("false-positive", "audited-count"), oracle("gap", "partial-count")],
                )
                result = run(args)
                by_id = {row["identity"]: row for row in result["results"]}
                self.assertEqual(result["counts"], dict.fromkeys(check.VERDICTS, 1))
                self.assertEqual((by_id["missed"]["verdict"], by_id["missed"]["side"]), ("supported", "baseline"))
                self.assertEqual(by_id["missed"]["attempts"][0]["observed"], 3)
                self.assertEqual((by_id["false-positive"]["verdict"], by_id["false-positive"]["side"]),
                                 ("refuted", "candidate"))
                self.assertEqual(by_id["gap"]["reason"], "evidence_incomplete")
                self.assertEqual(by_id["no-check"]["reason"], "no_approved_check_for_claim")
                self.assertNotIn("agreed", by_id)
                self.assertEqual(["false-positive", "missed"], [r["identity"] for r in result["results"][:2]])
                self.assertEqual(result, run(args))
                self.assertFalse(result["agreementSampled"])

    def test_changed_finding_keeps_both_claims_and_prioritizes_the_dispute(self):
        args = inputs(base=[report_finding("same", 2, "critical")],
                      candidate=[report_finding("same", 3, "low")],
                      facts=[fact("actual", 3)], entries=[oracle("same", "actual")])
        sides = {row["side"]: row for row in run(args)["results"]}
        self.assertEqual({s: (r["verdict"], r["priority"]) for s, r in sides.items()},
                         {"baseline": ("refuted", "critical"), "candidate": ("supported", "critical")})
        self.assertEqual(sides["baseline"]["comparisonRowSha256"], sides["candidate"]["comparisonRowSha256"])

    def test_incomplete_comparison_coverage_never_becomes_removal_or_support(self):
        args = inputs(base=[report_finding("prior", 3, "high")], facts=[fact("actual", 3)],
                      entries=[oracle("prior", "actual")])
        args[3]["coverage"] = [coverage(status="failed")]
        row, = run(args)["results"]
        self.assertEqual((row["comparison"], row["verdict"], row["reason"]),
                         ("incomparable", "inconclusive", "coverage_not_complete"))
        self.assertEqual(row["candidateCoverage"]["status"], "failed")
        self.assertEqual(row["attempts"], [])

    def test_other_scope_cannot_supply_a_missing_fact(self):
        args = inputs(candidate=[report_finding("single", 4)],
                      facts=[fact("actual", 4, scope="service-b")],
                      entries=[oracle("single", "actual")],
                      coverage_rows=[coverage(), coverage(scope="service-b")],
                      partitions=[partition(), partition(scope="service-b")])
        row, = run(args)["results"]
        self.assertEqual((row["verdict"], row["reason"]), ("inconclusive", "evidence_missing"))
        self.assertEqual(row["attempts"][0]["evidenceReferences"], [])

    def test_cheapest_available_oracle_selected_and_otherwise_falls_back(self):
        for cheap_exists in (False, True):
            with self.subTest(cheap_exists=cheap_exists):
                refs = [fact("members", ["a", "b", "b"])]
                if cheap_exists:
                    refs.append(fact("count", 2))
                args = inputs(candidate=[report_finding("count", 2)], facts=refs,
                              entries=[oracle("count", "members", key="set", op="count_distinct"),
                                       oracle("count", "count", key="scalar")])
                result = run(args, limits=check.Limits(checks=1, work=5))
                row, = result["results"]
                self.assertEqual(row["verdict"], "supported")
                self.assertEqual([r["checkId"] for r in row["attempts"]],
                                 ["scalar"] if cheap_exists else ["scalar", "set"])
                self.assertEqual(result["budget"]["checksUsed"], 1)
                self.assertEqual(result["budget"]["workUsed"], 1 if cheap_exists else 5)

    def test_count_bounds_and_scalar_types_do_not_create_false_refutations(self):
        args = inputs(candidate=[report_finding("type", 1), report_finding("large", 2)],
                      facts=[fact("boolean", True), fact("set", ["a"] * (check.MAX_ITEMS + 1))],
                      entries=[oracle("type", "boolean"), oracle("large", "set", op="count_distinct")])
        outcomes = {row["identity"]: (row["verdict"], row["reason"]) for row in run(args)["results"]}
        self.assertEqual(outcomes, {"type": ("inconclusive", "evidence_type_mismatch"),
                                    "large": ("inconclusive", "unsupported_evidence_shape")})

    def test_attempt_and_work_budgets_leave_lower_priority_unresolved(self):
        args = inputs(candidate=[report_finding("a-low", 1, "low"), report_finding("z-critical", 1, "critical")],
                      facts=[fact("actual", 1)],
                      entries=[oracle("a-low", "actual"), oracle("z-critical", "actual")])
        for limits in (check.Limits(checks=1), check.Limits(work=1)):
            with self.subTest(limits=limits):
                result = run(args, limits=limits)
                self.assertEqual([(r["identity"], r["verdict"]) for r in result["results"]],
                                 [("z-critical", "supported"), ("a-low", "inconclusive")])
                self.assertEqual(result["results"][1]["reason"], "budget_exhausted")

    def test_deadline_and_execution_errors_never_return_a_truth_verdict(self):
        args = inputs(candidate=[report_finding("one", 1)], facts=[fact("actual", 1)],
                      entries=[oracle("one", "actual")])
        clock = iter([0.0, 0.001, 0.020]).__next__
        timed = run(args, limits=check.Limits(deadline_ms=10), clock=clock)["results"][0]
        self.assertEqual((timed["verdict"], timed["reason"]), ("inconclusive", "deadline_exceeded"))
        for error, reason in ((TimeoutError(), "deadline_exceeded"), (ValueError(), "check_failed")):
            with self.subTest(reason=reason), patch.object(check, "_observe", side_effect=error):
                row, = run(args)["results"]
                self.assertEqual((row["verdict"], row["reason"]), ("inconclusive", reason))

    def test_unrecognized_projection_is_not_testable(self):
        row = report_finding("one", 1)
        row["semantics"].pop("assertionId")
        args = inputs(candidate=[row], facts=[fact("actual", 1)], entries=[oracle("one", "actual")])
        out, = run(args)["results"]
        self.assertEqual((out["verdict"], out["reason"]), ("not_testable", "unsupported_assertion_projection"))


class BindingTests(unittest.TestCase):
    def setUp(self):
        self.args = inputs(candidate=[report_finding("one", 1)], facts=[fact("actual", 1)],
                           entries=[oracle("one", "actual")])

    def test_pins_and_receipts_fail_closed(self):
        with self.assertRaisesRegex(check.InputError, "reviewed pin"):
            check.verify(*self.args, "d" * 64)
        changed = copy.deepcopy(self.args)
        changed[-1]["fixtureSha256"] = "a" * 64
        with self.assertRaisesRegex(check.InputError, "does not bind"):
            run(changed)
        changed = copy.deepcopy(self.args)
        changed[3]["fixtureSha256"] = "a" * 64
        with self.assertRaisesRegex(paired.EvaluationError, "exact shared input"):
            run(changed)
        changed = copy.deepcopy(self.args)
        changed[-1]["checks"][0]["source"]["revision"] = "unversioned"
        with self.assertRaisesRegex(check.InputError, "immutable pin"):
            run(changed)

    def test_comparison_is_reconstructed_not_trusted_and_original_hash_preserved(self):
        comparison = paired.compare(*self.args[:4])
        comparison["runs"]["baseline"]["adapterDigestVerifiedByRunner"] = True
        report = run(self.args, original=comparison)
        self.assertEqual(report["comparisonSha256"], paired.sha(paired.canonical(comparison)))
        self.assertEqual(report["comparisonOrigin"], "matched_supplied_report")
        changed = copy.deepcopy(comparison)
        changed["partitions"][0]["outcomes"][0]["candidate"][0]["semantics"]["asserted"] = 99
        with self.assertRaisesRegex(check.InputError, "differs from the validated receipts"):
            run(self.args, original=changed)

    def test_fact_and_check_collisions_and_command_like_specs_are_rejected(self):
        for label, amend in (
            ("duplicate independent fact", lambda a: a[0]["evidence"]["verificationFacts"].append(
                a[0]["evidence"]["verificationFacts"][0])),
            ("duplicate check", lambda a: a[-1]["checks"].append(a[-1]["checks"][0])),
            ("unsupported deterministic oracle", lambda a: a[-1]["checks"][0].update(oracle="process")),
        ):
            with self.subTest(label=label):
                args = copy.deepcopy(self.args)
                amend(args)
                if label == "duplicate independent fact":
                    digest = paired.sha(paired.canonical(args[0]))
                    for row in args[1:]:
                        row["fixtureSha256"] = digest
                with self.assertRaisesRegex(check.InputError, label):
                    run(args)

    def test_cli_binary_output_and_explicit_failure(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            command = [sys.executable, str(ROOT / "scripts/assurance/verify_divergent_findings.py")]
            for name, data in zip(("fixture", "plan", "baseline", "candidate", "checks"), self.args):
                path = root / (name + ".json")
                path.write_bytes(paired.canonical(data))
                command += ["--" + name, str(path)]
            good = subprocess.run(command + ["--checks-sha256", paired.sha(paired.canonical(self.args[-1]))],
                                  capture_output=True, check=True, timeout=15)
            self.assertEqual(json.loads(good.stdout), run(self.args))
            bad = subprocess.run(command + ["--checks-sha256", "b" * 64],
                                 capture_output=True, check=False, timeout=15)
            self.assertEqual((bad.returncode, bad.stdout), (2, b""))


if __name__ == "__main__":
    unittest.main()
