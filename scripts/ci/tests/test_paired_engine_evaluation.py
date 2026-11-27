"""Independent acceptance cases for FND-078 paired engine evaluation."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "scripts" / "assurance"))
import paired_engine_evaluation as pair  # noqa: E402

NATIVE = "authoritative-source-v1"
CANONICAL = "archlucid-finding-v2"


def partition(family="topology", scope="service-a", scheme=NATIVE):
    return {"family": family, "scopeKey": scope, "identityScheme": scheme}


def fixture(product="ArchLucid", partitions=None):
    return {
        "schemaVersion": 1, "product": product, "caseId": "fixture-A", "cohortVersion": "reference/1",
        "partitions": partitions if partitions is not None else [partition()],
        "evidence": {"fixture": "golden-A"}, "policy": {"revision": "test-only/1"},
        "scope": {"binding": "synthetic-project-A"}, "configuration": {"mode": "deterministic"},
    }


def engine(tag, adapter_hash="a" * 64):
    return {"id": "fixture-" + tag, "revision": ("b" if tag == "baseline" else "c") * 40,
            "model": None, "promptVersion": "test/1", "adapterSha256": adapter_hash}


def plan_for(world, baseline=None, candidate=None):
    return {"schemaVersion": 1, "fixtureSha256": pair.sha(pair.canonical(world)),
            "baseline": baseline or engine("baseline"), "candidate": candidate or engine("candidate")}


def coverage(family="topology", scope="service-a", status="complete", scheme=NATIVE):
    return {"family": family, "scopeKey": scope, "status": status, "identityScheme": scheme,
            "reason": None if status == "complete" else "test fixture unavailable"}


def finding(identity, value=1, source=None, family="topology", scope="service-a", refs=None):
    return {"family": family, "scopeKey": scope, "sourceId": source or "original-" + str(identity),
            "identity": identity, "semantics": {"value": value}, "provenance": refs or ["fixture:row-1"]}


def receipt(plan, role, findings=(), coverage_rows=None):
    return {"schemaVersion": 1, "fixtureSha256": plan["fixtureSha256"], "engine": plan[role],
            "coverage": [coverage()] if coverage_rows is None else coverage_rows, "findings": list(findings)}


class ComparisonTest(unittest.TestCase):
    def evaluate(self, baseline=(), candidate=(), left=None, right=None, world=None):
        world = world or fixture()
        plan = plan_for(world)
        return pair.compare(world, plan, receipt(plan, "baseline", baseline, left),
                            receipt(plan, "candidate", candidate, right))

    def test_all_five_outcomes_have_independently_written_expectations(self):
        report = self.evaluate(
            baseline=[finding("removed"), finding("same", source="prior"), finding("changed"),
                      finding("collision"), finding("collision", source="legacy-copy")],
            candidate=[finding("added"), finding("same", source="after"), finding("changed", 2),
                       finding("collision")],
        )
        expected = {"added": "added", "removed": "removed", "same": "agreed",
                    "changed": "changed", "collision": "incomparable"}
        self.assertEqual({row["identity"]: row["classification"]
                          for row in report["partitions"][0]["outcomes"]}, expected)
        self.assertEqual(report["countsByFamily"]["topology"], {classification: 1 for classification in expected.values()})
        collision = next(row for row in report["partitions"][0]["outcomes"] if row["identity"] == "collision")
        self.assertEqual(collision["reason"], "identity_collision")
        self.assertCountEqual([r["sourceId"] for r in collision["baseline"]], ["original-collision", "legacy-copy"])
        self.assertFalse(report["truthAdjudicated"])

    def test_empty_reported_coverage_is_not_equivalent_to_empty_complete_analysis(self):
        for status in ("partial", "failed", "notEvaluated", "notApplicable", "stale", None):
            with self.subTest(status=status):
                report = self.evaluate(baseline=[finding("prior")],
                                       right=[coverage(status=status)] if status else [])
                scope = report["partitions"][0]
                self.assertEqual(scope["candidateCoverage"]["status"], status or "missing")
                self.assertEqual(scope["outcomes"][0]["reason"], "coverage_not_complete")
                self.assertEqual(report["countsByFamily"]["topology"]["removed"], 0)
                self.assertEqual(report["status"], "hasIncomparables")
        complete = self.evaluate(baseline=[finding("prior")])
        self.assertEqual(complete["countsByFamily"]["topology"]["removed"], 1)

    def test_empty_on_both_sides_requires_coverage_for_agreement_claims(self):
        unknown = self.evaluate(left=[], right=[])
        self.assertEqual(unknown["countsByFamily"]["topology"]["incomparable"], 1)
        self.assertEqual(unknown["countsByFamily"]["topology"]["agreed"], 0)
        complete = self.evaluate()
        self.assertEqual(complete["status"], "compared")
        self.assertEqual(complete["partitions"][0]["outcomes"], [])
        self.assertFalse(complete["truthAdjudicated"])

    def test_identity_scheme_mismatch_is_not_a_match_or_a_regression(self):
        report = self.evaluate(baseline=[finding("same")], candidate=[finding("same")],
                               right=[coverage(scheme="other-model-v3")])
        self.assertEqual(report["partitions"][0]["outcomes"][0]["reason"], "identity_scheme_mismatch")
        self.assertEqual(report["countsByFamily"]["topology"]["agreed"], 0)

    def test_opaque_canonical_key_is_reused_without_rehashing(self):
        key = "fnd:v2:" + "a" * 64
        report = self.evaluate(baseline=[finding(key, source="base-row")],
                               candidate=[finding(key, 2, source="candidate-row")],
                               left=[coverage(scheme=CANONICAL)], right=[coverage(scheme=CANONICAL)],
                               world=fixture(partitions=[partition(scheme=CANONICAL)]))
        comparison = report["partitions"][0]["outcomes"][0]
        self.assertEqual(comparison["identity"], key)
        self.assertEqual(comparison["classification"], "changed")
        self.assertEqual(comparison["baseline"][0]["sourceId"], "base-row")
        self.assertEqual(comparison["candidate"][0]["provenance"], ["fixture:row-1"])

    def test_missing_authoritative_id_preserves_a_possible_counterpart(self):
        first = [finding("certain"), finding("potentially-matched")]
        second = [finding("certain"), finding(None, source="unknown-alias")]
        report = self.evaluate(baseline=first, candidate=second)
        self.assertEqual(report["partitions"][0]["status"], "partiallyComparable")
        self.assertEqual(report["countsByFamily"]["topology"],
                         {"added": 0, "removed": 0, "changed": 0, "agreed": 1, "incomparable": 2})
        self.assertEqual([r["reason"] for r in report["partitions"][0]["outcomes"]],
                         ["authoritative_identity_missing", None, "candidate_identity_unresolved"])

    def test_family_and_scope_never_match_across_boundaries(self):
        world = fixture(partitions=[partition(), partition("cost"), partition(scope="service-b")])
        complete = [coverage(), coverage("cost"), coverage(scope="service-b")]
        report = self.evaluate(
            baseline=[finding("token")],
            candidate=[finding("token", family="cost"), finding("token", scope="service-b")],
            left=complete, right=complete, world=world)
        self.assertEqual(report["countsByFamily"]["cost"]["added"], 1)
        self.assertEqual(report["countsByFamily"]["topology"]["added"], 1)
        self.assertEqual(report["countsByFamily"]["topology"]["removed"], 1)
        self.assertEqual(report["countsByFamily"]["topology"]["agreed"], 0)

    def test_observation_order_does_not_change_classifications(self):
        left = [finding("one", refs=["fixture:B", "fixture:A"]), finding("two")]
        right = [finding("two", 2), finding("one")]
        one = self.evaluate(baseline=left, candidate=right)
        two = self.evaluate(baseline=left[::-1], candidate=right[::-1])
        self.assertEqual(one["partitions"], two["partitions"])
        self.assertEqual(one["countsByFamily"], two["countsByFamily"])
        self.assertNotEqual(one["runs"]["baseline"]["receiptSha256"], two["runs"]["baseline"]["receiptSha256"])

    def test_model_version_input_and_metadata_pins_reject_incomparable_execution(self):
        original = fixture()
        plan = plan_for(original)
        base, cand = receipt(plan, "baseline"), receipt(plan, "candidate")
        for key in ("evidence", "policy", "scope", "configuration"):
            with self.subTest(key=key):
                altered = copy.deepcopy(original)
                altered[key]["changed"] = True
                with self.assertRaisesRegex(pair.EvaluationError, "fixture pin"):
                    pair.compare(altered, plan, base, cand)
        for key, altered in (("revision", "e" * 40), ("promptVersion", "test/2"), ("model", "model-new")):
            with self.subTest(key=key):
                changed = {**cand, "engine": {**cand["engine"], key: altered}}
                with self.assertRaisesRegex(pair.EvaluationError, "differs from the pin"):
                    pair.compare(original, plan, base, changed)
        with self.assertRaisesRegex(pair.EvaluationError, "exact shared input"):
            pair.compare(original, plan, base, {**cand, "fixtureSha256": "f" * 64})

    def test_malformed_coverage_and_out_of_scope_observation_fail_closed(self):
        for rows in ([coverage(), coverage()], [coverage(family="undeclared")],
                     [{**coverage(status="failed"), "reason": None}]):
            with self.subTest(rows=rows), self.assertRaises(pair.EvaluationError):
                self.evaluate(right=rows)
        with self.assertRaisesRegex(pair.EvaluationError, "outside"):
            self.evaluate(candidate=[finding("alien", scope="unrequested")])
        with self.assertRaisesRegex(pair.EvaluationError, "duplicate JSON field"):
            pair.decode(b'{"engine": 1, "engine": 2}', "receipt")
        with self.assertRaises(pair.EvaluationError):
            pair.decode(b'{"value": 1e999}', "receipt")


# A neutral demonstrator runs independently in each pinned adapter process.
# It uses the existing ArchLucid golden case threshold and the independently
# documented simple reference graph, not a production/cloud engine.
ADAPTER = """
import hashlib
import json
import sys
from pathlib import Path

wire = sys.stdin.buffer.read()
world = json.loads(wire)
evidence = world['evidence']
partition = world['partitions'][0]
family, scope = partition['family'], partition['scopeKey']
limit = ALGORITHM_LIMIT
if world['product'] == 'ArchLucid':
    threshold = evidence['case']['minimumStructuralCompleteness']
    observations = [(key, ratio) for key, ratio in evidence['ratios'].items() if ratio < threshold + limit]
else:
    frontier = [(evidence['start'], 0)]
    visited = {evidence['start']}
    observations = []
    for node, steps in frontier:
        if node in evidence['terminals']:
            observations.append((node, steps))
        if steps < limit:
            for successor in evidence['adjacency'].get(node, []):
                if successor not in visited:
                    visited.add(successor)
                    frontier.append((successor, steps + 1))
print(json.dumps({
  'schemaVersion': 1,
  'fixtureSha256': hashlib.sha256(wire).hexdigest(),
  'engine': {**ENGINE, 'adapterSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
  'coverage': [{**partition, 'status': 'complete', 'reason': None}],
  'findings': [
      {'family': family, 'scopeKey': scope, 'sourceId': key, 'identity': key,
       'semantics': {'value': value}, 'provenance': ['fixture:hand-derived']}
      for key, value in observations
  ],
}, allow_nan=False))
"""


class PairedExecutionTest(unittest.TestCase):
    def test_both_products_repeat_the_same_comparison_in_both_orders(self):
        golden = json.loads((ROOT / "tests/golden-corpus/agent-output-reference-cases.json").read_text())
        reference_case = next(row for row in golden if row["caseId"] == "core-topology-structure")
        # 0.55 is below both thresholds. 0.70 falls only below the tightened 0.75 threshold.
        arch = fixture()
        arch["evidence"] = {"case": reference_case, "ratios": {"shared": 0.55, "new": 0.70}}
        # The FND-171 worked graph has only B at one edge and both B and C at two.
        sec = fixture("SecureNow", [partition("reference-graph", "example")])
        sec["evidence"] = {"adjacency": {"A": ["B"], "B": ["C"], "C": ["A"]},
                           "start": "A", "terminals": ["B", "C"]}
        for world, limits, expected in (
            (arch, (0.0, 0.1), {"new": "added", "shared": "agreed"}),
            (sec, (1, 2), {"B": "agreed", "C": "added"}),
        ):
            with self.subTest(world["product"]), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                adapters, pins = {}, {}
                for role, limit in zip(pair.ROLES, limits):
                    path = root / f"{role}.py"
                    pin = engine(role)
                    path.write_text(f"ENGINE = {pin!r}\nALGORITHM_LIMIT = {limit!r}\n" + ADAPTER, encoding="utf-8")
                    adapters[role] = path
                    pins[role] = {**pin, "adapterSha256": pair.sha(path.read_bytes())}
                plan = plan_for(world, **pins)
                report = pair.run_pair(world, plan, adapters, retain_receipts=root / "receipts")
                self.assertEqual(report, pair.run_pair(world, plan, adapters, order=pair.ROLES[::-1]))
                self.assertEqual({r["identity"]: r["classification"] for r in report["partitions"][0]["outcomes"]}, expected)
                self.assertTrue(all(run["adapterDigestVerifiedByRunner"] for run in report["runs"].values()))

                (root / "fixture.json").write_bytes(pair.canonical(world))
                (root / "plan.json").write_bytes(pair.canonical(plan))
                process = subprocess.run([
                    sys.executable, str(ROOT / "scripts/assurance/paired_engine_evaluation.py"), "compare",
                    "--fixture", str(root / "fixture.json"), "--plan", str(root / "plan.json"),
                    "--baseline", str(root / "receipts/baseline.json"),
                    "--candidate", str(root / "receipts/candidate.json"),
                ], capture_output=True, check=True, timeout=15)
                replay = json.loads(process.stdout)
                self.assertEqual(replay["partitions"], report["partitions"])
                self.assertEqual(replay["countsByFamily"], report["countsByFamily"])
                self.assertFalse(replay["runs"]["baseline"]["adapterDigestVerifiedByRunner"])

                adapters["candidate"].write_text("raise RuntimeError('must not execute after pin mismatch')\n")
                with self.assertRaisesRegex(pair.EvaluationError, "adapter pin"):
                    pair.run_pair(world, plan, adapters)

    def test_failed_executable_does_not_emit_comparable_receipts(self):
        world = fixture()
        cases = (
            ("raise SystemExit(4)", "exited 4"),
            ("import time; time.sleep(10)", "timed out"),
            ("import sys; sys.stdout.write('x' * 5000000)", "byte budget"),
        )
        for code, error in cases:
            with self.subTest(error), tempfile.TemporaryDirectory() as temp:
                path = Path(temp) / "reject.py"
                path.write_text(code)
                digest = pair.sha(path.read_bytes())
                plan = plan_for(world, engine("baseline", digest), engine("candidate", digest))
                with self.assertRaisesRegex(pair.EvaluationError, error):
                    pair.run_pair(world, plan, {"baseline": path, "candidate": path}, timeout=1)


if __name__ == "__main__":
    unittest.main()
