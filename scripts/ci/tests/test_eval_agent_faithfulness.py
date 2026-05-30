import importlib.util
import json
import os
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "eval_agent_faithfulness.py"
SPEC = importlib.util.spec_from_file_location("eval_agent_faithfulness", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class EvalAgentFaithfulnessTests(unittest.TestCase):
    def test_resolve_min_support_ratio_honors_env_override(self) -> None:
        prior = os.environ.get("ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO")
        os.environ["ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO"] = "0.91"
        try:
            ratio = MODULE._resolve_min_support_ratio({"minSupportRatio": 0.8})
            self.assertEqual(ratio, 0.91)
        finally:
            if prior is None:
                os.environ.pop("ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO", None)
            else:
                os.environ["ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO"] = prior

    def test_evaluate_case_classifies_missing_citation_wrong_corpus_and_roi_cost_claim(self) -> None:
        hits = [
            {"sourceId": "policy-a", "title": "Policy A", "corpusKind": "PriorManifest"},
            {"sourceId": "policy-b", "title": "Policy B", "corpusKind": "PolicyPack"},
        ]

        retrieved, supported, ratio, missing, wrong_corpus, unsupported_claims = MODULE._evaluate_case(
            hits,
            "Policy B supports this finding, but the cost claim omits its baseline.",
            expected_corpus_kind="PolicyPack",
            required_evidence_tokens=["cost-baseline-q2"],
            claim_issue_kind="unsupported-roi-cost-claim",
        )

        self.assertEqual(retrieved, 2)
        self.assertEqual(supported, 1)
        self.assertEqual(ratio, 0.5)
        self.assertEqual(missing, ["policy-a"])
        self.assertEqual(wrong_corpus, ["policy-a"])
        self.assertEqual(unsupported_claims, ["unsupported-roi-cost-claim"])

    def test_golden_cases_meet_minimum_count(self) -> None:
        cases_path = Path(__file__).resolve().parents[3] / "tests" / "eval-datasets" / "faithfulness-golden" / "cases.json"
        payload = json.loads(cases_path.read_text(encoding="utf-8"))
        cases = payload["cases"]
        self.assertGreaterEqual(len(cases), 25)

    def test_summarize_by_category_groups_cases(self) -> None:
        rows = [
            {"category": "roi-cost-supported", "ratio": 1.0},
            {"category": "roi-cost-supported", "ratio": 0.5},
            {"category": "missing-citation", "ratio": 0.0},
        ]
        summary = MODULE._summarize_by_category(rows)
        self.assertEqual(len(summary), 2)
        roi = next(item for item in summary if item["category"] == "roi-cost-supported")
        self.assertEqual(roi["caseCount"], 2)
        self.assertAlmostEqual(float(roi["meanSupportRatio"]), 0.75)

    def test_cohort_kind_splits_readiness_from_negative_controls(self) -> None:
        self.assertEqual(MODULE._cohort_kind("azure-saas-readiness"), "positive-readiness")
        self.assertEqual(MODULE._cohort_kind("missing-citation"), "negative-control")
        self.assertEqual(MODULE._cohort_kind("wrong-corpus"), "negative-control")
        self.assertEqual(MODULE._cohort_kind("roi-cost-unsupported"), "negative-control")

    def test_mean_ratio_handles_empty_rows(self) -> None:
        self.assertEqual(MODULE._mean_ratio([]), 0.0)
        self.assertEqual(MODULE._mean_ratio([{"ratio": 1.0}, {"ratio": 0.5}]), 0.75)

    def test_enforce_faithfulness_floors_flags_low_positive_and_detector_misses(self) -> None:
        cases = [
            {
                "id": "positive-low",
                "category": "azure-saas-readiness",
                "cohortKind": "positive-readiness",
                "ratio": 0.5,
                "missingCitationIds": [],
                "wrongCorpusIds": [],
                "unsupportedRoiCostClaims": [],
            },
            {
                "id": "missing-citation-pass",
                "category": "missing-citation",
                "cohortKind": "negative-control",
                "ratio": 0.0,
                "missingCitationIds": ["fabricated-1"],
                "wrongCorpusIds": [],
                "unsupportedRoiCostClaims": [],
            },
        ]

        failures = MODULE._enforce_faithfulness_floors(
            cases=cases,
            mean_ratio=0.25,
            min_ratio=0.8,
            min_positive_ratio=0.8,
            max_negative_ratio=0.35,
        )

        self.assertTrue(any("positive readiness" in failure for failure in failures))
        self.assertTrue(any("combined diagnostic" in failure for failure in failures))


if __name__ == "__main__":
    unittest.main()
