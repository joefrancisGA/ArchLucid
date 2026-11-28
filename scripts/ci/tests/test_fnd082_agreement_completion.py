"""End-to-end controls for FND-082 aggregation, review, and export."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from test_paired_engine_evaluation import ROOT, coverage, finding, receipt
from test_review_divergent_findings import current
from test_sample_engine_agreements import SOURCE, fixture_inputs, observed, sampled, target

import paired_engine_evaluation as paired
import review_divergent_findings as adjudication
import sample_engine_agreements as sampler
import summarize_engine_agreement_cohort as cohort_summary

SECRET = b"s" * 32


def approval(report, selected=None, partition="regression"):
    selected = selected or report["reviewQueue"][0]
    product, case_id = report["product"], report["caseId"]
    return {
        "schemaVersion": 1,
        "case": {"reviewId": "blind-82", "caseId": case_id, "reportSha256": sampler.digest(report),
                 "rowSha256": selected["rowSha256"], "dataClass": "reviewed_synthetic", "material": True,
                 "scopeAlias": "scope-review", "question": "Which value is supported by the reference evidence?",
                 "producers": ["engine-producer"], "proofSource": SOURCE,
                 "evidence": [{"alias": "card-1", "summary": "Reviewed reference about the scoped sample."}]},
        "reviewers": [
            {"id": actor, "active": True, "products": [product], "families": ["topology"],
             "qualification": "fixture-qualification/1", "conflicts": []}
            for actor in ("reviewer-a", "reviewer-b", "engine-producer")
        ],
        "corpus": {"schemaVersion": 1, "corpusVersion": "agreement-release-1", "protectedHoldout": [], "entries": [{
            "caseId": case_id, "inputSha256": sampler.digest(report["inputFingerprints"]),
            "sourceGroup": "fixture-lineage-82", "partition": partition,
        }]},
    }


def review_for(report, *, partition="regression"):
    policy = approval(report, partition=partition)
    return adjudication.Review(report, policy, sampler.digest(policy), SECRET)


def proposal_for(review, expected, basis):
    proof = review.agreement["proof"]
    return {"action": "propose", "decision": "supports_option",
            "option": next(k for k, v in review.values.items() if v is expected),
            "basis": basis, "proofSha256": sampler.digest(proof) if basis == "reproducible" else None,
            "rationale": "The scoped synthetic reference supports this interpretation.",
            "evidence": ["card-1"], "uncertainty": "Only the pinned fixture is covered."}


def approve(review, expected, basis="reproducible"):
    ledger = review.append(review.blank(), current(review.blank()), "reviewer-a", proposal_for(review, expected, basis))
    return review.append(ledger, current(ledger), "reviewer-b", {
        "action": "accept", "targetSha256": current(ledger), "rationale": "Confirmed under independent review.",
    })


def cohort_for(*reports):
    return {"schemaVersion": 1, "cohortVersion": "reviewed-cohort/1", "dataClass": "reviewed_synthetic",
            "products": sorted({report["product"] for report in reports}),
            "cases": [{**{key: report[key] for key in ("caseId", "product", "fixtureSha256")},
                       "reportSha256": sampler.digest(report)} for report in reports]}


def summarizing(*reports, manifest=None):
    manifest = cohort_for(*reports) if manifest is None else manifest
    return cohort_summary.summarize(manifest, sampler.digest(manifest), list(reports))


def frame(report, product, name="shared_silence"):
    return next(row for row in report["products"][product]["frames"]
                if row["severity"] == "critical" and row["frame"] == name)


class AgreementCompletionTests(unittest.TestCase):
    def setUp(self):
        self.miss = target("private-missing-finding")
        self.inputs = fixture_inputs([(self.miss, "complete", True)])
        self.result = sampled(self.inputs)
        self.review = review_for(self.result)

    def test_blinded_packet_and_two_independent_people_apply_existing_ledger_rules(self):
        report = self.result
        self.assertEqual(report["reviewQueue"][0]["rowSha256"], sampler.digest(report["sampledResults"][0]))
        self.assertCountEqual(self.review.values.values(), [True, False])
        packet = json.dumps(self.review.packet)
        for secret in ("shared_silence", "shared_false_negative", "baseline", "candidate", self.miss["identity"],
                       self.miss["assertionId"], SOURCE["locator"], "engine-producer", "service-a"):
            self.assertNotIn(secret, packet)
        proposal = proposal_for(self.review, True, "reproducible")
        with self.assertRaisesRegex(ValueError, "not eligible"):
            self.review.append(self.review.blank(), current(self.review.blank()), "engine-producer", proposal)
        proposed = self.review.append(self.review.blank(), current(self.review.blank()), "reviewer-a", proposal)
        with self.assertRaisesRegex(ValueError, "different independent"):
            self.review.append(proposed, current(proposed), "reviewer-a", {
                "action": "accept", "targetSha256": current(proposed), "rationale": "Invalid self-accept.",
            })

    def test_shared_miss_replays_into_fnd080_regression_then_pinned_fnd081_adjudication(self):
        for product in paired.PRODUCTS:
            with self.subTest(product=product):
                inputs = fixture_inputs([(self.miss, "complete", True)], product=product)
                review = review_for(sampled(inputs))
                ledger = approve(review, True)
                exported = review.export_agreement(ledger, current(ledger), *inputs)
                pin, head = sampler.digest(exported), current(ledger)
                self.assertEqual(exported["kind"], "adjudicated-finding-regression")
                self.assertEqual(exported["product"], product)
                fixed = receipt(inputs[1], "candidate", [observed(self.miss)])
                self.assertEqual(adjudication.check_regression(exported, pin, head, *inputs[:2], fixed)["status"],
                                 "passed")
                with self.assertRaisesRegex(ValueError, "did not reproduce"):
                    adjudication.check_regression(exported, pin, head, *inputs[:2], inputs[3])
                fixed["findings"][0]["semantics"]["severity"] = "low"
                with self.assertRaisesRegex(ValueError, "did not reproduce"):
                    adjudication.check_regression(exported, pin, head, *inputs[:2], fixed)
                handoff = adjudication.promotion_handoff(exported, pin, head)
                self.assertEqual(handoff["label"], {
                    "family": self.miss["family"], "scopeKey": self.miss["scopeKey"], "identity": self.miss["identity"],
                    "severity": "critical", "truth": "accepted_adjudication",
                    "expected": {"assertionId": self.miss["assertionId"], "asserted": True},
                    "activeHeadSha256": head, "evidenceSha256": pin,
                })
                self.assertTrue(handoff["requiresIndependentCohortApproval"])
                self.assertFalse(handoff["promotionAuthorized"])
                self.assertEqual(handoff["adjudications"], [exported])

    def test_missing_evidence_and_missing_engine_coverage_can_be_reviewed_but_not_promoted(self):
        for inputs in (fixture_inputs([(self.miss, "partial", True)]),
                       fixture_inputs([(self.miss, "complete", True)], right=[])):
            report = sampled(inputs)
            review = review_for(report)
            self.assertEqual(report["reviewQueue"][0]["outcome"], "unknown")
            self.assertEqual(report["fnd081LabelCandidates"], [])
            ledger = approve(review, True, "human_judgment")
            with self.assertRaisesRegex(ValueError, "unknown or unproven"):
                review.export_agreement(ledger, current(ledger), *inputs)
            with self.assertRaisesRegex(ValueError, "known shared error"):
                approve(review, True)

    def test_known_correct_unsampled_and_divergent_cases_cannot_enter_review(self):
        correct, unsampled, divergent = (target("correct"), target("unsampled", "low"), target("divergent"))
        inputs = fixture_inputs([(correct, "complete", False), (unsampled, "complete", True),
                                 (divergent, "complete", True)], after=[observed(divergent)])
        inputs[-1]["samplesPerFrame"]["low"] = 0
        report = sampled(inputs)
        self.assertEqual(report["reviewQueue"], [])
        bad = approval(report, {"rowSha256": sampler.digest(report["sampledResults"][0])})
        with self.assertRaisesRegex(ValueError, "not a unique review candidate"):
            adjudication.Review(report, bad, sampler.digest(bad), SECRET)

    def test_wrong_conclusion_judgment_and_holdout_do_not_export(self):
        human = approve(self.review, True, "human_judgment")
        wrong = approve(self.review, False)
        for ledger in (human, wrong):
            with self.subTest(ledger=ledger), self.assertRaisesRegex(ValueError, "exact proof"):
                self.review.export_agreement(ledger, current(ledger), *self.inputs)
        holdout = review_for(self.result, partition="holdout")
        ledger = approve(holdout, True)
        with self.assertRaisesRegex(ValueError, "only the regression"):
            holdout.export_agreement(ledger, current(ledger), *self.inputs)

    def test_export_requires_exact_paired_receipts_and_original_manifest(self):
        ledger = approve(self.review, True)
        changed = copy.deepcopy(self.inputs)
        changed[2]["findings"].append(observed(self.miss))
        with self.assertRaisesRegex(ValueError, "inputs differ"):
            self.review.export_agreement(ledger, current(ledger), *changed)
        changed = copy.deepcopy(self.inputs)
        changed[-1]["selectionSeedSha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "manifest digest"):
            self.review.export_agreement(ledger, current(ledger), *changed)

    def test_reviewer_cannot_approve_proof_from_other_source(self):
        policy = approval(self.result)
        policy["case"]["proofSource"] = {**SOURCE, "revision": "9" * 40}
        review = adjudication.Review(self.result, policy, sampler.digest(policy), SECRET)
        ledger = approve(review, True)
        with self.assertRaisesRegex(ValueError, "approved exact proof"):
            review.export_agreement(ledger, current(ledger), *self.inputs)

    def test_dispute_revokes_the_export_and_stale_handoff(self):
        ledger = approve(self.review, True)
        head = current(ledger)
        exported = self.review.export_agreement(ledger, head, *self.inputs)
        dispute = self.review.append(ledger, head, "reviewer-a",
                                     {"action": "dispute", "targetSha256": head, "rationale": "Needs new evidence."})
        with self.assertRaisesRegex(ValueError, "no active accepted"):
            self.review.export_agreement(dispute, current(dispute), *self.inputs)
        with self.assertRaisesRegex(ValueError, "stale"):
            adjudication.promotion_handoff(exported, sampler.digest(exported), current(dispute))

    def test_shared_false_positive_export_requires_proven_scope_absence(self):
        row = observed(self.miss)
        inputs = fixture_inputs([(self.miss, "complete", False)], before=[row], after=[row])
        review = review_for(sampled(inputs))
        ledger = approve(review, False)
        export = review.export_agreement(ledger, current(ledger), *inputs)
        pin, head = sampler.digest(export), current(ledger)
        self.assertEqual(export["expectationMode"], "no_finding")
        self.assertIsNone(export["expected"]["asserted"])
        fixed = receipt(inputs[1], "candidate")
        self.assertEqual(adjudication.check_regression(export, pin, head, *inputs[:2], fixed)["status"], "passed")
        for wrong in (inputs[3], receipt(inputs[1], "candidate", [finding(None)])):
            with self.assertRaisesRegex(ValueError, "adjudicated absence"):
                adjudication.check_regression(export, pin, head, *inputs[:2], wrong)
        partial = receipt(inputs[1], "candidate", coverage_rows=[coverage(status="partial")])
        with self.assertRaisesRegex(ValueError, "incomplete"):
            adjudication.check_regression(export, pin, head, *inputs[:2], partial)
        handoff = adjudication.promotion_handoff(export, pin, head)
        self.assertIsNone(handoff["label"]["expected"])
        self.assertEqual(handoff["sourceLedgerHeadSha256"], head)
        self.assertEqual(handoff["label"]["truth"], "independent_corpus")
        self.assertEqual(handoff["adjudications"], [])

    def test_explicit_false_scalar_is_an_assertion_not_a_no_finding_export(self):
        slot = target("boolean-scalar", form="scalar_assertion")
        row = observed(slot)
        inputs = fixture_inputs([(slot, "complete", False)], before=[row], after=[row])
        review = review_for(sampled(inputs))
        ledger = approve(review, False)
        export = review.export_agreement(ledger, current(ledger), *inputs)
        self.assertEqual(export["expectationMode"], "emitted_assertion")
        self.assertIs(export["expected"]["asserted"], False)
        handoff = adjudication.promotion_handoff(export, sampler.digest(export), current(ledger))
        self.assertIs(handoff["label"]["expected"]["asserted"], False)
        self.assertEqual(handoff["adjudications"], [export])

    def test_original_paired_report_replays_runner_flags_without_claiming_authority(self):
        adapter_pins = {role: self.inputs[1][role]["adapterSha256"] for role in paired.ROLES}
        original = paired.compare(*self.inputs[:4], loaded_adapter_hashes=adapter_pins)
        review = review_for(sampled(self.inputs, original=original))
        ledger = approve(review, True)
        with self.assertRaisesRegex(ValueError, "inputs differ"):
            review.export_agreement(ledger, current(ledger), *self.inputs)
        export = review.export_agreement(ledger, current(ledger), *self.inputs, original=original)
        self.assertEqual(export["comparisonSha256"], sampler.digest(original))

    def test_cli_export_agreement_and_promotion_handoff(self):
        script = ROOT / "scripts" / "assurance" / "review_divergent_findings.py"
        rules = approval(self.result)
        ledger = approve(self.review, True)
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)

            def put(name, value):
                path = work / name
                path.write_text(json.dumps(value), encoding="utf-8")
                return str(path)

            def run(command, *args):
                r = subprocess.run([sys.executable, str(script), command, *args], capture_output=True, text=True)
                self.assertEqual(r.returncode, 0, r.stderr)
                return json.loads(r.stdout)

            secret = work / "secret"
            secret.write_text(SECRET.hex(), encoding="utf-8")
            inputs = ["--report", put("report", self.result), "--policy", put("policy", rules),
                      "--secret-file", str(secret), "--policy-sha256", sampler.digest(rules),
                      "--ledger", put("ledger", ledger), "--head", current(ledger)]
            for name, data in zip(("fixture", "plan", "baseline", "candidate", "checks", "manifest"), self.inputs):
                inputs += ["--" + name, put(name, data)]
            exported = run("export-agreement", *inputs)
            handoff = run("promotion-handoff", "--regression", put("regression", exported),
                          "--regression-sha256", sampler.digest(exported), "--active-head", current(ledger))
            self.assertEqual(handoff["label"]["identity"], self.miss["identity"])


class AgreementCohortTests(unittest.TestCase):
    def setUp(self):
        miss = target("miss")
        self.first = sampled(fixture_inputs([(miss, "complete", True)]))
        self.second = sampled(fixture_inputs([(miss, "partial", True)], product="SecureNow"))

    def test_separates_products_unknowns_and_error_rate_bounds(self):
        report = summarizing(self.first, self.second)
        stable = summarizing(self.second, self.first, manifest=cohort_for(self.first, self.second))
        self.assertEqual(report, stable)
        left, right = (frame(report, product) for product in ("ArchLucid", "SecureNow"))
        self.assertEqual(left["shared_false_negative"], 1)
        self.assertEqual(left["eligibleErrorRateRangeBps"], [10000, 10000])
        self.assertEqual(right["confirmedErrors"], 0)
        self.assertEqual(right["unknownSampled"], 1)
        self.assertEqual(right["eligibleErrorRateRangeBps"], [0, 10000])
        self.assertIsNone(frame(report, "SecureNow", "shared_assertion")["eligibleErrorRateRangeBps"])
        self.assertFalse(report["promotionAuthorized"])

    def test_outside_coverage_is_neither_error_nor_eligible(self):
        uncertain = sampled(fixture_inputs([(target("unobservable"), "complete", True)], right=[]))
        report = summarizing(uncertain)
        self.assertEqual(report["products"]["ArchLucid"]["unknownOutsideFrame"], 1)
        self.assertEqual(frame(report, "ArchLucid")["eligible"], 0)

    def test_missing_duplicate_and_unpinned_reports_reject(self):
        manifest = cohort_for(self.first, self.second)
        with self.assertRaisesRegex(ValueError, "required case report missing"):
            summarizing(self.first, manifest=manifest)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            summarizing(self.first, self.first, manifest=manifest)
        self.first["policyVersion"] = "different"
        with self.assertRaisesRegex(ValueError, "altered case report"):
            summarizing(self.first, self.second, manifest=manifest)

    def test_renaming_same_product_case_cannot_double_count_it(self):
        renamed = copy.deepcopy(self.first)
        renamed["caseId"] = "synthetic-renamed"
        with self.assertRaisesRegex(ValueError, "duplicate fixture input"):
            summarizing(self.first, renamed)

    def test_summary_cross_checks_selected_results_instead_of_trusting_counts(self):
        selected = next(row for row in self.first["frameSummaries"] if row["confirmedErrors"])
        selected["confirmedErrors"] = 0
        with self.assertRaisesRegex(ValueError, "does not match recorded evidence"):
            summarizing(self.first)

    def test_cohort_cli_uses_exact_inventory_pin(self):
        script = ROOT / "scripts" / "assurance" / "summarize_engine_agreement_cohort.py"
        manifest = cohort_for(self.first, self.second)
        with tempfile.TemporaryDirectory() as directory:
            paths = [Path(directory) / name for name in ("cohort.json", "first.json", "second.json")]
            for path, value in zip(paths, (manifest, self.first, self.second)):
                path.write_text(json.dumps(value), encoding="utf-8")
            command = [sys.executable, str(script), "--cohort", str(paths[0]),
                       "--report", str(paths[1]), "--report", str(paths[2]), "--cohort-sha256"]
            good = subprocess.run([*command, sampler.digest(manifest)], capture_output=True, text=True)
            self.assertEqual(good.returncode, 0, good.stderr)
            self.assertEqual(json.loads(good.stdout), summarizing(self.first, self.second))
            bad = subprocess.run([*command, "0" * 64], capture_output=True, text=True)
            self.assertEqual(bad.returncode, 2)
            self.assertFalse(bad.stdout)


if __name__ == "__main__":
    unittest.main()
