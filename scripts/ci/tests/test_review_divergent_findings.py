"""FND-080 acceptance cases with synthetic evidence and simulated reviewers."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from test_paired_engine_evaluation import ROOT, finding, fixture, plan_for, receipt

import paired_engine_evaluation as paired
import review_divergent_findings as adjudication

SECRET = b"A" * 32
SOURCE = {"id": "independent-source", "revision": "d" * 40, "locator": "synthetic/spec.json"}
SCOPE = {"family": "topology", "scopeKey": "service-a"}
IDENTITY = "private-finding-id"
ASSERTION = "private-assertion-id"
REFERENCE = "private-source-reference"


def sample(value=True, *, oracle="read_scalar", fact=True):
    world = fixture()
    world["evidence"]["verificationFacts"] = [{
        **SCOPE, "factId": "fact-1", "status": "complete", "value": fact, "references": [REFERENCE],
    }]
    plan = plan_for(world)

    def observation(asserted):
        row = finding(IDENTITY)
        row["semantics"] = {"assertionId": ASSERTION, "asserted": asserted, "severity": "critical"}
        return row

    before = receipt(plan, "baseline", [observation(False if type(value) is bool else value + 1)])
    after = receipt(plan, "candidate", [observation(value)])
    comparison = paired.compare(world, plan, before, after)
    part = comparison["partitions"][0]
    outcome = part["outcomes"][0]
    row_pin = adjudication.digest({**SCOPE, **outcome})
    checks = {"schemaVersion": 1, "fixtureSha256": plan["fixtureSha256"], "checks": [{
        **SCOPE, "checkId": "pinned-check", "version": "1", "identity": IDENTITY, "assertionId": ASSERTION,
        "valueType": "boolean" if type(value) is bool else "integer",
        "oracle": oracle, "factId": "fact-1", "source": SOURCE,
    }]}
    original = {
        "schemaVersion": 1, "kind": "divergent-finding-verification",
        "scopeOfVerdicts": "declared_scalar_assertions_only",
        "caseId": world["caseId"], "product": world["product"],
        "fixtureSha256": plan["fixtureSha256"], "comparisonSha256": adjudication.digest(comparison),
        "approvedCheckBundleSha256": adjudication.digest(checks),
        "inputFingerprints": comparison["inputFingerprints"], "comparisonRuns": comparison["runs"],
        "results": [
            {**SCOPE, "identity": IDENTITY, "comparison": "changed", "comparisonRowSha256": row_pin,
             "side": side, "observation": outcome[side][0], "priority": "critical",
             "baselineCoverage": part["baselineCoverage"], "candidateCoverage": part["candidateCoverage"],
             "verdict": "inconclusive", "reason": "check_budget_exhausted", "attempts": []}
            for side in paired.ROLES
        ],
    }
    proof = copy.deepcopy(original)
    proof["results"][1].update(verdict="supported", assertionId=ASSERTION, reason="verified_exact_assertion",
                               attempts=[{"checkId": "pinned-check", "checkVersion": "1",
                                          "oracle": oracle, "source": copy.deepcopy(SOURCE),
                                          "factId": "fact-1", "evidenceReferences": [REFERENCE],
                                          "status": "completed", "observed": value, "work": 1}])
    policy = {
        "schemaVersion": 1,
        "case": {"reviewId": "blind-01", "caseId": world["caseId"], "rowSha256": row_pin,
                 "reportSha256": adjudication.digest(original), "dataClass": "reviewed_synthetic",
                 "scopeAlias": "scope-01", "material": True, "question": "Which value is supported in this scope?",
                 "producers": ["comparison-producer"], "proofSource": copy.deepcopy(SOURCE),
                 "evidence": [{"alias": "card-1", "summary": "Reference table records one synthetic sample."}]},
        "reviewers": [
            {"id": name, "active": name != "inactive", "products": ["ArchLucid"] if name != "other" else ["SecureNow"],
             "families": ["topology"], "qualification": "review-roster/1",
             "conflicts": [world["caseId"]] if name == "conflicted" else []}
            for name in ("reviewer-1", "reviewer-2", "reviewer-3", "inactive", "other", "conflicted",
                         "comparison-producer")
        ],
        "corpus": {"schemaVersion": 1, "corpusVersion": "corpus-1", "protectedHoldout": [], "entries": [{
            "caseId": world["caseId"], "inputSha256": adjudication.digest(original["inputFingerprints"]),
            "sourceGroup": "synthetic-lineage-1", "partition": "regression",
        }]},
    }
    return world, plan, before, after, checks, original, proof, policy


def current(ledger):
    return ledger["events"][-1]["eventSha256"] if ledger["events"] else adjudication.digest(ledger["anchor"])


class AdjudicationTest(unittest.TestCase):
    def setUp(self):
        self.world, self.plan, self.before, self.after, self.checks, self.report, self.proof, self.policy = sample()

    def review(self, secret=SECRET):
        return adjudication.Review(self.report, self.policy, adjudication.digest(self.policy), secret)

    def pin_report(self):
        self.policy["case"]["reportSha256"] = adjudication.digest(self.report)

    def proposal(self, review, basis="reproducible"):
        return {"action": "propose", "decision": "supports_option",
                "option": next(label for label, side in review.mapping.items() if side == "candidate"),
                "basis": basis, "proofSha256": adjudication.digest(self.proof) if basis == "reproducible" else None,
                "rationale": "Expected value was scoped to the reviewed sample.",
                "evidence": ["card-1"], "uncertainty": "No assertion about coverage outside this sample."}

    def proposed(self, review, basis="reproducible"):
        return review.append(review.blank(), current(review.blank()), "reviewer-1", self.proposal(review, basis))

    def transition(self, review, ledger, action, target=None, **extras):
        head = current(ledger)
        return review.append(ledger, head, "reviewer-2",
                             {"action": action, "targetSha256": target or head, "rationale": "Independent review.",
                              **extras})

    def accepted(self, review, basis="reproducible"):
        return self.transition(review, self.proposed(review, basis), "accept")

    def export(self, review, ledger):
        return review.export(ledger, current(ledger), self.proof, self.world, self.checks)

    def test_packet_is_blinded_scoped_and_repeatable(self):
        review = self.review()
        self.assertEqual(review.packet, self.review().packet)
        self.assertNotEqual(review.anchor, self.review(b"B" * 32).anchor)
        rendered = json.dumps(review.packet)
        for private in ("baseline", "candidate", "service-a", "topology", IDENTITY, ASSERTION, REFERENCE,
                        "fixture-A", "reviewer-1", SOURCE["id"], SOURCE["locator"], self.plan["fixtureSha256"]):
            self.assertNotIn(private, rendered)
        self.assertCountEqual([row["asserted"] for row in review.packet["options"]], [True, False])
        self.assertEqual(review.packet["coverageStates"], ["complete", "complete"])

    def test_incomparable_and_non_scalar_never_infer_a_negative(self):
        self.report["results"] = [{**self.report["results"][0], "comparison": "incomparable",
                                   "observation": None, "side": None,
                                   "baselineCoverage": {"status": "missing", "reason": "private", "identityScheme": None}}]
        self.pin_report()
        review = self.review()
        self.assertEqual(review.packet["options"], [])
        self.assertEqual(review.packet["coverageStates"], ["complete", "missing"])
        self.assertIs(review.packet["missingOptionMeansFalse"], False)
        self.assertNotIn("private", json.dumps(review.packet))

    def test_added_observation_does_not_impute_the_other_side(self):
        self.report["results"] = [{**self.report["results"][1], "comparison": "added"}]
        self.pin_report()
        self.assertEqual(self.review().packet["options"], [{"label": "A", "asserted": True}])

    def test_string_observation_is_not_released(self):
        self.report["results"][1]["observation"]["semantics"]["asserted"] = "private-label"
        self.pin_report()
        self.assertEqual(self.review().packet["options"], [])
        self.assertNotIn("private-label", json.dumps(self.review().packet))

    def test_intake_rejects_wrong_pin_material_class_and_resolved_cases(self):
        with self.assertRaisesRegex(ValueError, "policy digest mismatch"):
            adjudication.Review(self.report, self.policy, "0" * 64, SECRET)
        self.report["private"] = True
        with self.assertRaisesRegex(ValueError, "report digest mismatch"):
            self.review()
        self.pin_report()
        self.policy["case"]["dataClass"] = "tenant"
        with self.assertRaisesRegex(ValueError, "reviewed synthetic"):
            self.review()
        self.policy["case"]["dataClass"] = "reviewed_synthetic"
        self.policy["case"]["material"] = False
        with self.assertRaisesRegex(ValueError, "material"):
            self.review()
        self.policy["case"]["material"] = True
        for item in self.report["results"]:
            item["verdict"] = "supported"
        self.pin_report()
        with self.assertRaisesRegex(ValueError, "no unresolved"):
            self.review()

    def test_only_qualified_independent_reviewers_may_change_state(self):
        review = self.review()
        ledger = review.blank()
        for actor in ("comparison-producer", "conflicted", "inactive", "unknown", "other"):
            with self.subTest(actor=actor), self.assertRaisesRegex(ValueError, "eligible or independent"):
                review.append(ledger, current(ledger), actor, self.proposal(review))
        proposal = self.proposed(review)
        with self.assertRaisesRegex(ValueError, "different independent reviewer"):
            review.append(proposal, current(proposal), "reviewer-1",
                          {"action": "accept", "targetSha256": current(proposal), "rationale": "Self review."})

    def test_only_scoped_references_and_explicit_uncertainty_allowed(self):
        review = self.review()
        for field, value in (("evidence", ["other-scope"]), ("evidence", ["card-1", "card-1"]),
                             ("uncertainty", ""), ("option", "C")):
            with self.subTest(field=field), self.assertRaises(ValueError):
                review.append(review.blank(), current(review.blank()), "reviewer-1",
                              {**self.proposal(review), field: value})

    def test_unaccepted_disputed_and_judgment_only_labels_do_not_export(self):
        review = self.review()
        with self.assertRaisesRegex(ValueError, "no active accepted label"):
            self.export(review, self.proposed(review))
        with self.assertRaisesRegex(ValueError, "not an automated"):
            self.export(review, self.accepted(review, "human_judgment"))
        with self.assertRaisesRegex(ValueError, "no active accepted label"):
            self.export(review, self.transition(review, self.accepted(review), "dispute"))

    def test_dispute_and_supersession_preserve_ledger(self):
        review = self.review()
        accepted = self.accepted(review, "human_judgment")
        disputed = self.transition(review, accepted, "dispute")
        proposed = review.append(disputed, current(disputed), "reviewer-1", self.proposal(review))
        with self.assertRaisesRegex(ValueError, "explicit supersession"):
            self.transition(review, proposed, "accept")
        with self.assertRaisesRegex(ValueError, "reference the disputed"):
            self.transition(review, proposed, "supersede", replacesSha256=current(disputed))
        final = self.transition(review, proposed, "supersede", replacesSha256=current(accepted))
        self.assertEqual(final["events"][:-1], proposed["events"])
        self.assertEqual(self.export(review, final)["approvalSha256"], current(final))

    def test_proposal_can_be_disputed_and_replaced_without_an_accepted_label(self):
        review = self.review()
        old = self.proposed(review)
        disputed = self.transition(review, old, "dispute")
        proposal = review.append(disputed, current(disputed), "reviewer-3", self.proposal(review))
        final = self.transition(review, proposal, "accept")
        self.assertEqual(final["events"][:2], disputed["events"])
        self.assertEqual(self.export(review, final)["ledgerHeadSha256"], current(final))

    def test_trusted_head_detects_truncation_and_history_rewrite(self):
        review = self.review()
        ledger = self.accepted(review)
        with self.assertRaisesRegex(ValueError, "trusted ledger head mismatch"):
            review.replay({**ledger, "events": ledger["events"][:-1]}, current(ledger))
        damaged = copy.deepcopy(ledger)
        damaged["events"][0]["event"]["rationale"] = "Altered."
        with self.assertRaisesRegex(ValueError, "hash chain"):
            review.replay(damaged, current(ledger))
        with self.assertRaisesRegex(ValueError, "not anchored"):
            self.review(b"Z" * 32).replay(ledger, current(ledger))

    def test_holdout_cannot_leak_into_tuning_or_regression_by_input_or_lineage(self):
        entries = self.policy["corpus"]["entries"]
        self.policy["corpus"]["protectedHoldout"] = [{
            "inputSha256": entries[0]["inputSha256"], "sourceGroup": "different-lineage",
        }]
        with self.assertRaisesRegex(ValueError, "holdout overlap"):
            self.review()
        self.policy["corpus"]["protectedHoldout"][0] = {
            "inputSha256": "a" * 64, "sourceGroup": entries[0]["sourceGroup"],
        }
        entries[0]["partition"] = "tuning"
        with self.assertRaisesRegex(ValueError, "holdout overlap"):
            self.review()
        entries[0]["partition"] = "holdout"
        review = self.review()
        with self.assertRaisesRegex(ValueError, "only the regression"):
            self.export(review, self.accepted(review))

    def test_unlisted_or_renamed_holdout_origin_is_not_exportable(self):
        entries = self.policy["corpus"]["entries"]
        entries.append({**entries[0], "caseId": "renamed-case", "partition": "holdout"})
        with self.assertRaisesRegex(ValueError, "holdout overlap"):
            self.review()
        entries.pop()
        entries[0]["partition"] = "tuning"
        review = self.review()
        with self.assertRaisesRegex(ValueError, "only the regression"):
            self.export(review, self.accepted(review))
        entries[0]["caseId"] = "unregistered"
        with self.assertRaisesRegex(ValueError, "must be registered"):
            self.review()

    def test_proof_cannot_change_comparison_scope_or_typed_expectation(self):
        original = copy.deepcopy(self.proof)
        for mutation, failure in [
            (lambda p: p.update(comparisonSha256="0" * 64), "not linked"),
            (lambda p: p["results"][1].update(scopeKey="other"), "siblings disagree"),
            (lambda p: p["results"][1]["observation"]["semantics"].update(asserted=1), "changed the scoped"),
            (lambda p: p["results"][1]["attempts"][0].update(observed=1), "completed approved check"),
            (lambda p: p["results"][1]["attempts"][0].update(checkId="unapproved"), "match exactly one"),
            (lambda p: p["results"][1]["attempts"][0].update(evidenceReferences=["invented"]), "not complete"),
        ]:
            self.proof = copy.deepcopy(original)
            mutation(self.proof)
            review = self.review()
            with self.subTest(failure=failure), self.assertRaisesRegex(ValueError, failure):
                self.export(review, self.accepted(review))

    def test_claimed_proof_is_not_enough_when_independent_evidence_disagrees(self):
        self.world, self.plan, self.before, self.after, self.checks, self.report, self.proof, self.policy = sample(
            fact=False)
        review = self.review()
        with self.assertRaisesRegex(ValueError, "independent evidence did not reproduce"):
            self.export(review, self.accepted(review))

    def test_integer_count_proof_can_export_only_its_exact_expectation(self):
        self.world, self.plan, self.before, self.after, self.checks, self.report, self.proof, self.policy = sample(
            2, oracle="count_distinct", fact=["a", "a", "b"])
        review = self.review()
        self.assertEqual(self.export(review, self.accepted(review))["expected"]["asserted"], 2)

    def test_regression_is_repeatable_and_failed_or_missing_outputs_do_not_pass(self):
        review = self.review()
        ledger = self.accepted(review)
        regression = self.export(review, ledger)
        pin = adjudication.digest(regression)
        self.assertEqual(regression, self.export(review, ledger))
        def check(observed, approval=current(ledger), regression_pin=pin):
            return adjudication.check_regression(regression, regression_pin, approval, self.world, self.plan, observed)

        self.assertEqual(check(self.after)["status"], "passed")
        for observed, expected_error in [(receipt(self.plan, "candidate", []), "did not reproduce"),
                                         (receipt(self.plan, "candidate", coverage_rows=[]), "coverage is incomplete"),
                                         ({**self.after, "findings": self.after["findings"] * 2}, "did not reproduce")]:
            with self.subTest(error=expected_error), self.assertRaisesRegex(ValueError, expected_error):
                check(observed)
        incorrect = copy.deepcopy(self.after)
        incorrect["findings"][0]["semantics"]["asserted"] = 1
        with self.assertRaisesRegex(ValueError, "did not reproduce"):
            check(incorrect)
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            check(self.after, regression_pin="0" * 64)
        disputed = self.transition(review, ledger, "dispute")
        with self.assertRaisesRegex(ValueError, "stale"):
            check(self.after, approval=current(disputed))

    def test_cli_intake_to_automated_regression(self):
        script = ROOT / "scripts" / "assurance" / "review_divergent_findings.py"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)

            def put(name, value):
                path = root / name
                path.write_text(json.dumps(value), encoding="utf-8")
                return str(path)

            def run(command, *args):
                output = subprocess.run([sys.executable, str(script), command, *args],
                                        capture_output=True, text=True, check=False)
                self.assertEqual(output.returncode, 0, output.stderr)
                return json.loads(output.stdout)

            key = root / "private-key"
            key.write_text(SECRET.hex(), encoding="ascii")
            operator = ["--report", put("report", self.report), "--policy", put("policy", self.policy),
                        "--secret-file", str(key), "--policy-sha256", adjudication.digest(self.policy)]
            review = self.review()
            self.assertEqual(run("packet", *operator), review.packet)
            start = run("genesis", *operator)["headSha256"]
            first = run("append", *operator, "--head", start, "--actor", "reviewer-1",
                        "--event", put("proposal", self.proposal(review)))
            second = run("append", *operator, "--head", current(first), "--actor", "reviewer-2",
                         "--ledger", put("first", first), "--event", put("approval", {
                             "action": "accept", "targetSha256": current(first), "rationale": "Verified evidence.",
                         }))
            world = put("fixture", self.world)
            result = run("export", *operator, "--ledger", put("second", second), "--head", current(second),
                         "--proof", put("proof", self.proof), "--fixture", world, "--checks", put("checks", self.checks))
            self.assertEqual(run("check-regression", "--regression", put("regression", result),
                                 "--regression-sha256", adjudication.digest(result), "--active-head", current(second),
                                 "--fixture", world,
                                 "--plan", put("plan", self.plan), "--receipt", put("receipt", self.after))["status"],
                             "passed")


if __name__ == "__main__":
    unittest.main()
