"""Synthetic FND-081 contract, negative controls, and local release rehearsal."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from test_paired_engine_evaluation import ROOT, finding, fixture, plan_for, receipt

import evaluate_engine_promotion as gate

BASELINE = "c" * 40
CANDIDATE = "d" * 40
PROFILE = "b" * 64
REFERENCE = "f" * 64
SCOPE = {"family": "topology", "scopeKey": "service-a"}
PRODUCTS = ("ArchLucid", "SecureNow")


def observed(identity, severity="critical", value=True, assertion="invariant"):
    result = finding(identity)
    result["semantics"] = {"severity": severity, "asserted": value, "assertionId": assertion}
    return result


def labelled(identity, severity="critical", value=True, *, truth="independent_corpus"):
    return {**SCOPE, "identity": identity, "severity": severity, "truth": truth,
            "evidenceSha256": None if truth == "unresolved" else REFERENCE, "activeHeadSha256": None,
            "expected": None if value is None else {"assertionId": "invariant", "asserted": value}}


def make_inputs(products=PRODUCTS):
    rules = {severity: {
        "weight": weight, "minPositive": 1 if severity == "critical" else 0,
        "minNegative": 1 if severity == "critical" else 0, "minCoverageBps": 10000,
        "maxUnknownBps": 0, "minPrecisionBps": 10000 if severity == "critical" else 0,
        "minRecallBps": 10000 if severity == "critical" else 0,
        "maxPrecisionDropBps": 0, "maxRecallDropBps": 0,
    } for severity, weight in zip(gate.SEVERITIES, (100, 20, 8, 3, 1))}
    policy = {"schemaVersion": 1, "policyVersion": "test-policy/1", "products": list(products),
              "minCasesPerProduct": 1, "severity": rules,
              "weightedQuality": {"minPrecisionBps": 0, "minRecallBps": 0,
                                  "maxPrecisionDropBps": 10000, "maxRecallDropBps": 10000},
              "verificationLimits": {"checks": 64, "work": 4096, "deadlineMs": 1500},
              "performance": {"minSamples": 3, "measures": {
                  "latencyMs": {"maxValue": 100, "maxIncreaseBps": 1000},
                  "peakMemoryKiB": {"maxValue": 20000, "maxIncreaseBps": None},
                  "costMicros": {"maxValue": 100, "maxIncreaseBps": 2000},
              }}}
    cohort = {"schemaVersion": 1, "cohortVersion": "synthetic-promotion/1", "dataClass": "reviewed_synthetic",
              "baselineReleaseSha": BASELINE, "engines": {}, "cases": []}
    run = {"schemaVersion": 1, "targetReleaseSha": CANDIDATE, "engines": {}, "cases": []}
    for product in products:
        world = fixture(product=product)
        case_id = "synthetic-" + product
        world["caseId"] = case_id
        plan = plan_for(world)
        checks = {"schemaVersion": 1, "fixtureSha256": plan["fixtureSha256"], "checks": []}
        cohort["engines"][product] = copy.deepcopy(plan["baseline"])
        run["engines"][product] = copy.deepcopy(plan["candidate"])
        cohort["cases"].append({"caseId": case_id, "product": product, "fixtureSha256": plan["fixtureSha256"],
                                "checkBundleSha256": gate.digest(checks), "performanceProfileSha256": PROFILE,
                                "labels": [labelled("present"), labelled("absent", value=None)]})
        base = copy.deepcopy(receipt(plan, "baseline", [observed("present")]))
        cand = copy.deepcopy(receipt(plan, "candidate", [observed("present")]))
        samples = {"latencyMs": [50, 45, 52], "peakMemoryKiB": [3200, 3300, 3000], "costMicros": [0, 0, 0]}
        run["cases"].append({"caseId": case_id, "fixture": world, "plan": plan, "baseline": base, "candidate": cand,
                             "checks": checks, "adjudications": [],
                             "performance": {"profile": PROFILE, "baseline": copy.deepcopy(samples),
                                             "candidate": copy.deepcopy(samples)}})
    return policy, cohort, run


def evaluate(policy, cohort, run):
    return gate.evaluate(policy, gate.digest(policy), cohort, gate.digest(cohort), run, gate.digest(run), CANDIDATE)


def codes(report):
    return {reason["code"] for reason in report["reasons"]}


def apply_oracle(case, item, identity, value=True):
    world, checks = item["fixture"], item["checks"]
    world["evidence"]["verificationFacts"] = [{
        **SCOPE, "factId": "oracle-fact", "status": "complete", "value": value, "references": ["synthetic/ref"],
    }]
    pin = gate.digest(world)
    case["fixtureSha256"] = item["plan"]["fixtureSha256"] = checks["fixtureSha256"] = pin
    item["baseline"]["fixtureSha256"] = item["candidate"]["fixtureSha256"] = pin
    checks["checks"] = [{
        **SCOPE, "checkId": "independent-rule", "version": "1", "identity": identity, "assertionId": "invariant",
        "valueType": "boolean", "oracle": "read_scalar", "factId": "oracle-fact",
        "source": {"id": "independent-reference", "revision": "a" * 40, "locator": "synthetic/ref"},
    }]
    case["checkBundleSha256"] = gate.digest(checks)


class EnginePromotionTests(unittest.TestCase):
    def setUp(self):
        self.policy, self.cohort, self.run = make_inputs()
        self.case = self.cohort["cases"][0]
        self.input = self.run["cases"][0]

    def evaluate(self):
        return evaluate(self.policy, self.cohort, self.run)

    def rehearsed(self, report, **kwargs):
        args = dict(pin=gate.digest(report), target=CANDIDATE, rollback=BASELINE, policy_pin=gate.digest(self.policy),
                    cohort_pin=gate.digest(self.cohort), run_pin=gate.digest(self.run))
        args.update(kwargs)
        return gate.rehearsal(report, **args)

    def test_clean_cross_product_cohort_is_auditable_and_does_not_authorize(self):
        result = self.evaluate()
        self.assertEqual(result, self.evaluate())
        self.assertEqual(result["decision"], "pass")
        self.assertIs(result["promotionAuthorized"], False)
        self.assertEqual(result["reasons"], [])
        for product in PRODUCTS:
            stats = result["metrics"][product]["critical"]
            self.assertEqual(stats["positive"], 1)
            self.assertEqual(stats["negative"], 1)
            self.assertEqual(stats["unknown"], 0)
            self.assertEqual(stats["candidate"], {
                "tp": 1, "fp": 0, "fn": 0, "tn": 1, "covered": 2, "coverageBps": 10000,
                "precisionBps": 10000, "recallBps": 10000,
            })
            self.assertEqual(result["candidateEnginePins"][product], gate.digest(self.run["engines"][product]))
        serialized = json.dumps(result)
        for hidden in ("service-a", "invariant", "private-reference", "fixture-baseline", "synthetic-ArchLucid"):
            self.assertNotIn(hidden, serialized)
        self.assertTrue(all(row["comparisonSha256"] != row["verificationSha256"]
                            for row in result["cases"].values()))

    def test_critical_miss_cannot_be_offset_by_weighted_lower_severity_gains(self):
        self.input["candidate"]["findings"].clear()
        for index in range(150):
            identity = f"minor-{index}"
            self.case["labels"].append(labelled(identity, "low"))
            self.input["candidate"]["findings"].append(observed(identity, "low"))
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("confirmed_critical_regression", codes(result))
        self.assertEqual(result["metrics"]["ArchLucid"]["critical"]["candidate"]["fn"], 1)
        self.assertEqual(result["metrics"]["ArchLucid"]["low"]["candidate"]["tp"], 150)
        self.assertGreater(result["metrics"]["ArchLucid"]["weighted"]["candidate"]["tp"],
                           result["metrics"]["ArchLucid"]["weighted"]["baseline"]["tp"])

    def test_refuted_new_critical_finding_blocks(self):
        self.input["candidate"]["findings"].append(observed("absent"))
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("confirmed_critical_regression", codes(result))
        self.assertEqual(result["metrics"]["ArchLucid"]["critical"]["candidate"]["fp"], 1)

    def test_changed_scalar_of_wrong_type_is_not_an_exact_match(self):
        self.input["candidate"]["findings"][0]["semantics"]["asserted"] = 1
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        stats = result["metrics"]["ArchLucid"]["critical"]["candidate"]
        self.assertEqual((stats["tp"], stats["fp"], stats["fn"]), (0, 1, 1))

    def test_downgrading_critical_finding_blocks_even_when_assertion_is_correct(self):
        self.input["candidate"]["findings"][0]["semantics"]["severity"] = "low"
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("confirmed_critical_regression", codes(result))

    def test_disagreement_without_independent_truth_blocks_at_highest_reported_risk(self):
        self.input["candidate"]["findings"].append(observed("unlabelled"))
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("unresolved_material_critical_disagreement", codes(result))
        self.assertEqual(result["metrics"]["ArchLucid"]["critical"]["unknown"], 1)

    def test_missing_priority_is_never_treated_as_minor(self):
        row = observed("unlabelled")
        del row["semantics"]["severity"]
        self.input["candidate"]["findings"].append(row)
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("unresolved_material_critical_disagreement", codes(result))

    def test_engine_agreement_on_unknown_critical_claim_is_not_truth(self):
        for role in gate.paired.ROLES:
            self.input[role]["findings"].append(observed("common-mode"))
        result = self.evaluate()
        self.assertEqual(result["decision"], "insufficient")
        self.assertEqual(result["metrics"]["ArchLucid"]["critical"]["unknown"], 1)
        self.assertIn("unresolved_critical_coverage_or_truth", codes(result))

    def test_paired_missing_coverage_is_not_a_confirmed_false_negative(self):
        self.input["candidate"]["coverage"] = []
        self.input["candidate"]["findings"] = []
        result = self.evaluate()
        self.assertEqual(result["decision"], "insufficient")
        stats = result["metrics"]["ArchLucid"]["critical"]
        self.assertEqual(stats["unknown"], 2)
        self.assertEqual(stats["candidate"]["fn"], 0)
        self.assertIsNone(stats["candidate"]["recallBps"])
        self.assertEqual(stats["candidate"]["coverageBps"], 0)
        self.assertIn("scope_not_comparable", codes(result))

    def test_incomparable_identity_cannot_pass_with_complete_partition(self):
        self.input["candidate"]["findings"].append(observed("present", value=False))
        result = self.evaluate()
        self.assertEqual(result["decision"], "insufficient")
        self.assertIn("incomparable_finding_identity_or_scope", codes(result))

    def test_required_case_shortfall_and_no_lower_severity_labels_are_visible(self):
        self.run["cases"].pop()
        result = self.evaluate()
        self.assertEqual(result["decision"], "insufficient")
        self.assertIn("required_case_missing", codes(result))
        self.assertIn("independent_sample_shortfall", codes(result))
        self.assertIn("independent_case_shortfall", codes(result))
        self.assertIsNone(result["metrics"]["ArchLucid"]["low"]["candidate"]["precisionBps"])

    def test_renamed_duplicate_case_cannot_inflate_independent_sample_size(self):
        cloned_case, cloned_input = copy.deepcopy((self.case, self.input))
        cloned_case["caseId"] = cloned_input["caseId"] = cloned_input["fixture"]["caseId"] = "relabelled-case"
        pin = gate.digest(cloned_input["fixture"])
        cloned_case["fixtureSha256"] = pin
        for key in ("plan", "checks", "baseline", "candidate"):
            cloned_input[key]["fixtureSha256"] = pin
        cloned_case["checkBundleSha256"] = gate.digest(cloned_input["checks"])
        self.cohort["cases"].append(cloned_case)
        self.run["cases"].append(cloned_input)
        with self.assertRaisesRegex(ValueError, "duplicate cohort inputs"):
            self.evaluate()

    def test_strata_and_relative_quality_thresholds_do_not_average_away_regressions(self):
        self.case["labels"].extend([labelled("medium-1", "medium"), labelled("medium-2", "medium")])
        self.input["baseline"]["findings"].extend([observed("medium-1", "medium"), observed("medium-2", "medium")])
        self.input["candidate"]["findings"].append(observed("medium-1", "medium"))
        self.policy["severity"]["medium"]["maxRecallDropBps"] = 4999
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("quality_threshold_regression", codes(result))
        self.assertEqual(result["metrics"]["ArchLucid"]["medium"]["candidate"]["recallBps"], 5000)
        self.policy["severity"]["medium"]["maxRecallDropBps"] = 5000
        self.assertEqual(self.evaluate()["decision"], "pass")

    def test_severity_weighted_rates_use_exact_thresholds_in_addition_to_strata(self):
        self.case["labels"].extend([labelled("high-1", "high"), labelled("high-2", "high")])
        self.input["baseline"]["findings"].extend([observed("high-1", "high"), observed("high-2", "high")])
        self.input["candidate"]["findings"].append(observed("high-1", "high"))
        self.policy["severity"]["high"]["maxRecallDropBps"] = 5000
        self.policy["weightedQuality"]["maxRecallDropBps"] = 1400
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertEqual(codes(result), {"weighted_quality_threshold_regression"})
        self.assertEqual(result["metrics"]["ArchLucid"]["weighted"]["candidate"]["recallBps"], 8571)

    def test_deterministic_fnd079_proof_can_confirm_unregistered_loss(self):
        self.input["baseline"]["findings"].append(observed("oracle-only"))
        apply_oracle(self.case, self.input, "oracle-only")
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("confirmed_critical_regression", codes(result))
        self.assertEqual(result["cases"][gate.digest(self.case["caseId"])]["verificationVerdicts"]["supported"], 1)
        self.assertEqual(result["metrics"]["ArchLucid"]["critical"]["unknown"], 1)
        self.policy["verificationLimits"]["checks"] = 0
        exhausted = self.evaluate()
        self.assertIn("unresolved_material_critical_disagreement", codes(exhausted))
        self.assertNotIn("confirmed_critical_regression", codes(exhausted))

    def test_deterministic_proof_conflict_never_silently_overwrites_independent_label(self):
        self.input["candidate"]["findings"][0]["semantics"]["asserted"] = False
        apply_oracle(self.case, self.input, "present", value=False)
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("independent_truth_conflict", codes(result))
        self.assertEqual(result["metrics"]["ArchLucid"]["critical"]["unknown"], 1)

    def test_fnd080_handoff_binds_exact_expected_scope_pin_and_head(self):
        export = {"schemaVersion": 1, "kind": "adjudicated-finding-regression", "dataClass": "reviewed_synthetic",
                  "fixtureSha256": self.case["fixtureSha256"], "caseId": self.case["caseId"],
                  "ledgerHeadSha256": "1" * 64, "expected": {**SCOPE, "identity": "present",
                                                            "assertionId": "invariant", "asserted": True},
                  "checkId": "approved-verification", "evidenceReferences": ["synthetic/ref"],
                  **dict.fromkeys(("corpusSha256", "comparisonSha256", "comparisonRowSha256", "proofSha256",
                                   "checkBundleSha256", "approvalSha256"), REFERENCE)}
        label = self.case["labels"][0]
        label.update(truth="accepted_adjudication", evidenceSha256=gate.digest(export), activeHeadSha256="1" * 64)
        self.input["adjudications"] = [export]
        self.assertEqual(self.evaluate()["decision"], "pass")
        label["activeHeadSha256"] = "2" * 64
        with self.assertRaisesRegex(ValueError, "stale"):
            self.evaluate()
        export["ledgerHeadSha256"] = "2" * 64
        export["expected"]["scopeKey"] = "out-of-scope"
        label["evidenceSha256"] = gate.digest(export)
        with self.assertRaisesRegex(ValueError, "out-of-scope"):
            self.evaluate()

    def test_p95_relative_and_absolute_budgets_and_unpaired_measurements(self):
        cand = self.input["performance"]["candidate"]
        cand["latencyMs"] = [45, 50, 58]
        cand["peakMemoryKiB"] = [15000, 15000, 22000]
        cand["costMicros"] = []
        result = self.evaluate()
        self.assertEqual(result["decision"], "block")
        self.assertEqual(codes(result), {"relative_performance_budget_exceeded", "absolute_performance_budget_exceeded",
                                         "paired_performance_sample_shortfall"})
        record = result["cases"][gate.digest(self.case["caseId"])]["performance"]
        self.assertEqual(record["latencyMs"]["candidate"]["p95"], 58)
        self.assertIsNone(record["costMicros"]["candidate"]["p95"])
        cand["latencyMs"] = [50, 45, 52]
        cand["peakMemoryKiB"] = [3200, 3300, 3000]
        self.assertEqual(self.evaluate()["decision"], "insufficient")

    def test_wrong_artifact_pins_inputs_build_and_measurement_profile_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "policy: digest mismatch"):
            gate.evaluate(self.policy, "0" * 64, self.cohort, gate.digest(self.cohort), self.run,
                          gate.digest(self.run), CANDIDATE)
        with self.assertRaisesRegex(ValueError, "candidate release"):
            gate.evaluate(self.policy, gate.digest(self.policy), self.cohort, gate.digest(self.cohort), self.run,
                          gate.digest(self.run), "2" * 40)
        self.input["fixture"]["scope"]["binding"] = "different"
        with self.assertRaisesRegex(ValueError, "cohort fixture: digest mismatch"):
            self.evaluate()
        self.input["fixture"]["scope"]["binding"] = "synthetic-project-A"
        self.input["candidate"]["engine"]["promptVersion"] = "unexpected"
        with self.assertRaisesRegex(ValueError, "receipt engine differs"):
            self.evaluate()
        self.input["candidate"]["engine"]["promptVersion"] = self.run["engines"]["ArchLucid"]["promptVersion"]
        self.input["performance"]["profile"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "different measurement profile"):
            self.evaluate()

    def test_rehearsal_checks_exact_current_gate_evidence(self):
        report = self.evaluate()
        result = self.rehearsed(report)
        self.assertIs(result["promotionAuthorized"], False)
        self.assertEqual(result["candidateReleaseSha"], CANDIDATE)
        self.assertEqual(result["rollbackReleaseSha"], BASELINE)
        self.assertEqual(result["rollbackEnginePins"]["ArchLucid"],
                         gate.digest(self.cohort["engines"]["ArchLucid"]))
        for wrong in ({"pin": "0" * 64}, {"target": "1" * 40}, {"rollback": "2" * 40},
                      {"cohort_pin": "3" * 64}, {"policy_pin": "4" * 64}, {"run_pin": "5" * 64}):
            with self.subTest(wrong=wrong), self.assertRaisesRegex(ValueError, "digest mismatch|different release"):
                self.rehearsed(report, **wrong)
        incomplete = dict(report, decision="insufficient")
        with self.assertRaisesRegex(ValueError, "passing advisory"):
            self.rehearsed(incomplete)
        bypass = dict(report, promotionAuthorized=True)
        with self.assertRaisesRegex(ValueError, "passing advisory"):
            self.rehearsed(bypass)

    def test_rehearsal_verifies_restored_engine_not_only_rollback_release_name(self):
        plan = self.rehearsed(self.evaluate())
        initial = {"releaseSha": BASELINE, "enginePins": plan["rollbackEnginePins"]}
        observations = {"schemaVersion": 1, "kind": "isolated-engine-promotion-observations",
                        "rehearsalSha256": gate.digest(plan), "before": initial,
                        "afterPromotion": {"releaseSha": CANDIDATE, "enginePins": plan["candidateEnginePins"]},
                        "afterRollback": copy.deepcopy(initial)}
        verified = gate.validate_restoration(plan, observations, gate.digest(observations))
        self.assertTrue(verified["rollbackIdentityVerified"])
        self.assertIs(verified["promotionAuthorized"], False)
        observations["afterRollback"]["enginePins"]["SecureNow"] = plan["candidateEnginePins"]["SecureNow"]
        with self.assertRaisesRegex(ValueError, "restored engine"):
            gate.validate_restoration(plan, observations, gate.digest(observations))

    def test_command_line_pass_blocks_invalid_evidence_and_rehearses_without_mutation(self):
        script = ROOT / "scripts" / "assurance" / "evaluate_engine_promotion.py"
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)

            def put(name, payload):
                path = work / name
                path.write_text(json.dumps(payload), encoding="utf-8")
                return str(path)

            def command(subcommand, *arguments):
                return subprocess.run([sys.executable, str(script), subcommand, *arguments],
                                      capture_output=True, text=True, check=False)

            files = ["--policy", put("policy.json", self.policy), "--cohort", put("cohort.json", self.cohort),
                     "--run", put("run.json", self.run)]
            inputs = ["--policy-sha256", gate.digest(self.policy), "--cohort-sha256", gate.digest(self.cohort),
                      "--run-sha256", gate.digest(self.run), "--target-release-sha", CANDIDATE]
            good = command("evaluate", *files, *inputs)
            self.assertEqual(good.returncode, 0, good.stderr)
            report = json.loads(good.stdout)
            report_args = ["--report", put("report.json", report), "--report-sha256", gate.digest(report),
                           "--baseline-release-sha", BASELINE]
            rehearsal = command("rehearse", *report_args, *inputs)
            self.assertEqual(rehearsal.returncode, 0, rehearsal.stderr)
            self.assertIs(json.loads(rehearsal.stdout)["promotionAuthorized"], False)
            self.input["candidate"]["findings"] = []
            put("run.json", self.run)
            invalid = command("evaluate", *files, *inputs)
            self.assertEqual(invalid.returncode, 2)
            self.assertFalse(invalid.stdout)
            self.assertNotIn(self.case["caseId"], invalid.stderr)
            inputs[5] = gate.digest(self.run)
            block = command("evaluate", *files, *inputs)
            self.assertEqual(block.returncode, 1, block.stderr)
            self.assertEqual(json.loads(block.stdout)["decision"], "block")
            self.assertEqual(command("rehearse", *report_args, *inputs).returncode, 2)

    def test_authorized_product_and_independence_minimums_cannot_be_weakened(self):
        self.cohort["dataClass"] = "tenant"
        with self.assertRaisesRegex(ValueError, "only"):
            self.evaluate()
        self.cohort["dataClass"] = "reviewed_synthetic"
        self.policy["severity"]["critical"]["minPositive"] = 0
        with self.assertRaisesRegex(ValueError, "requires independent"):
            self.evaluate()
        self.policy["severity"]["critical"]["minPositive"] = 1
        del self.cohort["engines"]["SecureNow"]
        with self.assertRaisesRegex(ValueError, "mismatched product set"):
            self.evaluate()


if __name__ == "__main__":
    unittest.main()
