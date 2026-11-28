"""Independent synthetic controls for FND-082 shared engine errors."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from test_paired_engine_evaluation import ROOT, coverage, finding, fixture, plan_for, receipt

import paired_engine_evaluation as paired
import sample_engine_agreements as sampler

SCOPE = {"family": "topology", "scopeKey": "service-a"}
SOURCE = {"id": "synthetic-independent-source", "revision": "5" * 40, "locator": "fixtures/reference.json"}


def target(identity, severity="critical", *, form="positive_boolean_finding", value_type="boolean"):
    return {**SCOPE, "identity": identity, "assertionId": "assertion-" + identity, "severity": severity,
            "form": form, "valueType": value_type, "checkId": "check-" + identity}


def observed(entry, value=True):
    record = finding(entry["identity"])
    record["semantics"] = {"assertionId": entry["assertionId"], "asserted": value, "severity": entry["severity"]}
    return record


def fixture_inputs(entries, *, product="ArchLucid", before=(), after=(), left=None, right=None):
    world = fixture(product=product)
    world["evidence"]["verificationFacts"] = [
        {**SCOPE, "factId": "fact-" + entry["identity"], "status": status,
         "value": value, "references": ["synthetic/ref-" + entry["identity"]]}
        for entry, status, value in entries if status is not None
    ]
    plan = plan_for(world)
    checks = {"schemaVersion": 1, "fixtureSha256": plan["fixtureSha256"], "checks": [
        {**{k: entry[k] for k in ("family", "scopeKey", "identity", "assertionId", "valueType", "checkId")},
         "version": "1", "source": SOURCE, "factId": "fact-" + entry["identity"], "oracle": "read_scalar"}
        for entry, _, _ in entries if entry["checkId"] is not None
    ]}
    manifest = {
        "schemaVersion": 1, "policyVersion": "synthetic/1", "dataClass": "reviewed_synthetic",
        "fixtureSha256": plan["fixtureSha256"], "checkBundleSha256": sampler.digest(checks),
        "selectionSeedSha256": "2" * 64,
        "samplesPerFrame": {severity: 20 for severity in sampler.SEVERITIES},
        "verificationLimits": {"checks": 64, "work": 4096, "deadlineMs": 1500},
        "targets": [entry for entry, _, _ in entries],
    }
    return world, plan, receipt(plan, "baseline", before, left), receipt(plan, "candidate", after, right), checks, manifest


def sampled(inputs, **kwargs):
    return sampler.sample(*inputs, sampler.digest(inputs[-1]), **kwargs)


def stratum(report, severity, frame):
    return next(row for row in report["frameSummaries"] if (row["severity"], row["frame"]) == (severity, frame))


class AgreementSamplingTests(unittest.TestCase):
    def test_shared_critical_miss_yields_exact_reviewable_fnd081_candidate_in_both_products(self):
        shared_miss = target("miss")
        for product in paired.PRODUCTS:
            with self.subTest(product=product):
                inputs = fixture_inputs([(shared_miss, "complete", True)], product=product)
                report = sampled(inputs)
                result, = report["sampledResults"]
                self.assertEqual(result["outcome"], "shared_false_negative")
                self.assertIs(result["sharedValue"], False)
                self.assertIs(result["proof"]["expected"], True)
                self.assertEqual(report["product"], product)
                self.assertEqual(report["excludedTargets"], [])
                candidate, = report["fnd081LabelCandidates"]
                self.assertTrue(candidate["requiresIndependentCohortApproval"])
                self.assertIs(report["promotionAuthorized"], False)
                self.assertEqual(candidate["fixtureSha256"], sampler.digest(inputs[0]))
                self.assertEqual(candidate["label"], {
                    **SCOPE, "identity": "miss", "severity": "critical", "truth": "independent_corpus",
                    "expected": {"assertionId": shared_miss["assertionId"], "asserted": True},
                    "activeHeadSha256": None, "evidenceSha256": sampler.digest(candidate["evidence"]),
                })
                self.assertEqual(stratum(report, "critical", "shared_silence")["errorCountRangeInEligibleFrame"], [1, 1])

    def test_shared_silence_can_be_correct_when_the_independent_predicate_is_false(self):
        report = sampled(fixture_inputs([(target("correct"), "complete", False)]))
        row, = report["sampledResults"]
        self.assertEqual(row["outcome"], "confirmed_correct")
        self.assertEqual(report["fnd081LabelCandidates"], [])
        self.assertEqual(stratum(report, "critical", "shared_silence")["errorCountRangeInEligibleFrame"], [0, 0])

    def test_incomplete_independent_evidence_is_unknown_despite_agreed_silence(self):
        report = sampled(fixture_inputs([(target("unknown"), "partial", True)]))
        row, = report["sampledResults"]
        self.assertEqual(row["outcome"], "unknown")
        self.assertEqual(row["reason"], "evidence_incomplete")
        self.assertIsNone(row["proof"])
        self.assertEqual(report["checksUsed"], 0)
        self.assertFalse(report["fnd081LabelCandidates"])
        self.assertEqual(stratum(report, "critical", "shared_silence")["errorCountRangeInEligibleFrame"], [0, 1])

    def test_incomplete_engine_coverage_does_not_establish_shared_silence(self):
        for left, right in (([], None), (None, []), ([], []), ([coverage(status="partial")], None),
                            (None, [coverage(scheme="other")])):
            with self.subTest(left=left, right=right):
                report = sampled(fixture_inputs([(target("miss"), "complete", True)], left=left, right=right))
                self.assertEqual(report["sampledResults"], [])
                self.assertEqual(report["fnd081LabelCandidates"], [])
                row, = report["excludedTargets"]
                self.assertEqual((row["state"], row["reason"]), ("unknown", "paired_coverage_incomplete"))
                self.assertEqual(stratum(report, "critical", "shared_silence")["eligible"], 0)

    def test_identity_ambiguity_cannot_be_sampled_as_an_agreement(self):
        slot = target("ambiguous")
        matching = observed(slot)
        unbound = finding(None)
        for left, right in (((unbound,), ()), ((matching, matching), (matching,))):
            with self.subTest(left=left, right=right):
                result = sampled(fixture_inputs([(slot, "complete", True)], before=left, after=right))
                self.assertEqual(result["sampledResults"], [])
                self.assertEqual(result["excludedTargets"][0]["reason"], "unresolved_finding_identity")

    def test_divergent_or_absent_scalar_conclusions_are_outside_agreement_frame(self):
        slot = target("divergent")
        scalar = target("scalar", form="scalar_assertion", value_type="integer")
        report = sampled(fixture_inputs([(slot, "complete", True), (scalar, "complete", 0)], after=[observed(slot)]))
        self.assertEqual(report["sampledResults"], [])
        self.assertEqual({row["reason"] for row in report["excludedTargets"]},
                         {"divergent_finding", "no_scalar_conclusion"})
        self.assertTrue(all(row["state"] == "outside_agreement" for row in report["excludedTargets"]))

    def test_same_presence_can_be_shared_false_positive_not_a_missing_finding(self):
        entered = target("false-positive")
        record = observed(entered)
        report = sampled(fixture_inputs([(entered, "complete", False)], before=[record], after=[record]))
        self.assertEqual(report["sampledResults"][0]["outcome"], "shared_false_positive")
        self.assertIsNone(report["fnd081LabelCandidates"][0]["label"]["expected"])

    def test_matching_scalar_error_produces_exact_typed_fix_not_absence(self):
        entered = target("scalar", form="scalar_assertion")
        record = observed(entered)
        report = sampled(fixture_inputs([(entered, "complete", False)], before=[record], after=[record]))
        self.assertEqual(report["sampledResults"][0]["outcome"], "shared_wrong_assertion")
        self.assertEqual(report["fnd081LabelCandidates"][0]["label"]["expected"],
                         {"assertionId": entered["assertionId"], "asserted": False})

    def test_value_type_mismatch_is_not_a_confirmation(self):
        slot = target("typed")
        result = sampled(fixture_inputs([(slot, "complete", 1)]))
        self.assertEqual(result["sampledResults"][0]["reason"], "evidence_type_mismatch")
        record = observed(slot, value=1)
        report = sampled(fixture_inputs([(slot, "complete", True)], before=[record], after=[record]))
        self.assertEqual(report["sampledResults"], [])
        self.assertEqual(report["excludedTargets"][0]["reason"], "no_matching_assertion")

    def test_integer_expectation_must_fit_fnd081_scalar_contract(self):
        slot = target("out-of-range", form="scalar_assertion", value_type="integer")
        record = observed(slot, value=0)
        report = sampled(fixture_inputs([(slot, "complete", 2**63)], before=[record], after=[record]))
        self.assertEqual(report["sampledResults"][0]["reason"], "value_outside_supported_range")
        self.assertEqual(report["fnd081LabelCandidates"], [])

    def test_independent_distinct_count_reuses_bounded_fnd079_oracle(self):
        slot = target("count", form="scalar_assertion", value_type="integer")
        record = observed(slot, value=1)
        inputs = fixture_inputs([(slot, "complete", ["a", "b", "b"])], before=[record], after=[record])
        inputs[-2]["checks"][0]["oracle"] = "count_distinct"
        inputs[-1]["checkBundleSha256"] = sampler.digest(inputs[-2])
        report = sampled(inputs)
        self.assertEqual(report["sampledResults"][0]["proof"]["expected"], 2)
        self.assertEqual(report["sampledResults"][0]["outcome"], "shared_wrong_assertion")
        self.assertEqual(report["workUsed"], 5)

    def test_sampling_is_stratified_without_replacement_and_order_invariant(self):
        entries = [(target(f"{severity}-{n}", severity), "complete", False)
                   for severity in ("critical", "high") for n in range(6)]
        record = observed(entries[0][0])
        another = observed(entries[1][0])
        inputs = fixture_inputs(entries, before=[record, another], after=[record, another])
        manifest = inputs[-1]
        manifest["samplesPerFrame"].update(critical=1, high=2)
        report = sampled(inputs)
        replay = copy.deepcopy(inputs)
        replay[-1]["targets"].reverse()
        replay[2]["findings"].reverse()
        replay[3]["findings"].reverse()
        rerun = sampled(replay)
        self.assertEqual(report["sampledResults"], rerun["sampledResults"])
        self.assertEqual(report["frameSummaries"], rerun["frameSummaries"])
        self.assertEqual(len({row["target"]["identity"] for row in report["sampledResults"]}), 4)
        self.assertEqual(stratum(report, "critical", "shared_assertion")["sampled"], 1)
        high = stratum(report, "high", "shared_silence")
        self.assertEqual((high["eligible"], high["sampled"], high["unsampled"]), (6, 2, 4))
        self.assertEqual(high["errorCountRangeInEligibleFrame"], [0, 4])

    def test_seed_changes_the_bounded_sample(self):
        inputs = fixture_inputs([(target(f"slot-{i}"), "complete", False) for i in range(16)])
        inputs[-1]["samplesPerFrame"]["critical"] = 2
        ids_for_seed_2 = [row["target"]["identity"] for row in sampled(inputs)["sampledResults"]]
        inputs[-1]["selectionSeedSha256"] = "3" * 64
        ids_for_seed_3 = [row["target"]["identity"] for row in sampled(inputs)["sampledResults"]]
        self.assertNotEqual(ids_for_seed_2, ids_for_seed_3)

    def test_critical_allocated_budget_before_minor_and_exhausted_is_unknown(self):
        inputs = fixture_inputs([(target("adm"), "complete", True), (target("minor", "low"), "complete", True)])
        inputs[-1]["verificationLimits"]["checks"] = 1
        report = sampled(inputs)
        self.assertEqual([row["outcome"] for row in report["sampledResults"]], ["shared_false_negative", "unknown"])
        self.assertEqual(report["sampledResults"][1]["reason"], "budget_exhausted")
        self.assertEqual(len(report["fnd081LabelCandidates"]), 1)

    def test_expired_check_is_unknown_even_when_oracle_could_confirm(self):
        inputs = fixture_inputs([(target("miss"), "complete", True)])
        timestamps = iter([0.0, 9.0])
        report = sampled(inputs, clock=lambda: next(timestamps))
        self.assertEqual(report["sampledResults"][0]["reason"], "deadline_exceeded")
        self.assertEqual(report["fnd081LabelCandidates"], [])

    def test_missing_fact_or_oracle_does_not_send_candidate_labels(self):
        human_candidate = target("no-oracle")
        human_candidate["checkId"] = None
        inputs = fixture_inputs([(target("no-fact"), None, None), (human_candidate, "complete", True)])
        report = sampled(inputs)
        self.assertEqual({row["reason"] for row in report["sampledResults"]},
                         {"evidence_missing", "no_approved_check"})
        self.assertEqual(report["fnd081LabelCandidates"], [])

    def test_manifest_pins_fixture_and_exact_scoped_check(self):
        inputs = fixture_inputs([(target("miss"), "complete", True)])
        with self.assertRaisesRegex(ValueError, "manifest digest mismatch"):
            sampler.sample(*inputs, "0" * 64)
        inputs[-1]["targets"][0]["assertionId"] = "different-claim"
        with self.assertRaisesRegex(ValueError, "exact scope and assertion"):
            sampled(inputs)
        inputs[-1]["targets"][0]["assertionId"] = "assertion-miss"
        inputs[-2]["checks"][0]["version"] = "other"
        with self.assertRaisesRegex(ValueError, "reviewed pin"):
            sampled(inputs)
        inputs[-1]["dataClass"] = "tenant"
        with self.assertRaisesRegex(ValueError, "reviewed synthetic"):
            sampled(inputs)

    def test_optional_original_pair_report_must_reproduce_exactly(self):
        inputs = fixture_inputs([(target("miss"), "complete", True)])
        report = paired.compare(*inputs[:4])
        checked = sampled(inputs, original=report)
        self.assertEqual(checked["comparisonOrigin"], "matched_supplied_report")
        self.assertEqual(checked["comparisonSha256"], sampler.digest(report))
        report["partitions"][0]["baselineCoverage"]["status"] = "partial"
        with self.assertRaisesRegex(ValueError, "differs"):
            sampled(inputs, original=report)

    def test_command_line_yields_pinned_private_advisory_handoff(self):
        inputs = fixture_inputs([(target("miss"), "complete", True)])
        script = ROOT / "scripts" / "assurance" / "sample_engine_agreements.py"
        with tempfile.TemporaryDirectory() as directory:
            command = [sys.executable, str(script)]
            for name, payload in zip(("fixture", "plan", "baseline", "candidate", "checks", "manifest"), inputs):
                path = Path(directory) / (name + ".json")
                path.write_text(json.dumps(payload), encoding="utf-8")
                command.extend(["--" + name, str(path)])
            command += ["--manifest-sha256", sampler.digest(inputs[-1])]
            result = subprocess.run(command, capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout), sampled(inputs))
            command[-1] = "0" * 64
            invalid = subprocess.run(command, capture_output=True, text=True, check=False)
            self.assertEqual(invalid.returncode, 2)
            self.assertEqual(invalid.stdout, "")


if __name__ == "__main__":
    unittest.main()
