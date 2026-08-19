import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "eval_agent_faithfulness.py"
PROFILES_PATH = Path(__file__).resolve().parents[1] / "retrieval_ablation_profiles.py"
SPEC = importlib.util.spec_from_file_location("eval_agent_faithfulness", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)

PROFILES_SPEC = importlib.util.spec_from_file_location("retrieval_ablation_profiles", PROFILES_PATH)
PROFILES_MODULE = importlib.util.module_from_spec(PROFILES_SPEC)
assert PROFILES_SPEC.loader is not None
PROFILES_SPEC.loader.exec_module(PROFILES_MODULE)


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
        # Phase A split cohort floors: combined diagnostic is suppressed when both cohort kinds are present.
        self.assertFalse(any("combined diagnostic" in failure for failure in failures))

    def test_ablation_report_includes_delta_table(self) -> None:
        cases_path = Path(__file__).resolve().parents[3] / "tests" / "eval-datasets" / "faithfulness-golden" / "cases.json"

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp = Path(tmp_dir)
            report_path = tmp / "faithfulness-report.md"

            completed = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_PATH),
                    "--cases",
                    str(cases_path),
                    "--report",
                    str(report_path),
                    "--json-summary",
                    str(tmp / "faithfulness-summary.json"),
                    "--ablation-summary",
                    str(tmp / "faithfulness-ablation-summary.json"),
                ],
                cwd=Path(__file__).resolve().parents[3],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(completed.returncode, 0, completed.stderr)
            report_text = report_path.read_text(encoding="utf-8")
            self.assertIn("## RAG-V2 ablation (TB-595)", report_text)
            self.assertIn("| Profile | Positive readiness | Δ vs all-on |", report_text)
            self.assertIn("EnableGraphRag=false", report_text)
            self.assertIn("EnableHyde=false", report_text)
            self.assertIn("EnableQueryRewrite=false", report_text)
            self.assertIn("EnableIterativeRetrieveCritiqueRetry=false", report_text)
            self.assertIn("All advanced off", report_text)

            ablation_payload = json.loads((tmp / "faithfulness-ablation-summary.json").read_text(encoding="utf-8"))
            self.assertEqual(ablation_payload.get("program"), "faithfulness-retrieval-ablation-tb595")
            delta_rows = ablation_payload.get("deltaVsAllOn")
            self.assertIsInstance(delta_rows, list)
            self.assertGreaterEqual(len(delta_rows), 6)
            first_row = delta_rows[0]
            self.assertIn("profileKey", first_row)
            self.assertIn("positiveDeltaVsAllOn", first_row)
            self.assertIn("combinedDeltaVsAllOn", first_row)

    def test_filter_hits_for_profile_drops_graph_rag_attribution(self) -> None:
        profile = next(item for item in PROFILES_MODULE.ABLATION_PROFILES if item.key == "graph-rag-off")
        hits = [
            {"sourceId": "rule-kv-01", "title": "Key Vault"},
            {"sourceId": "rule-mi-02", "title": "Managed Identity"},
        ]
        attribution = {
            "faithfulness-policy-cited": {
                "rule-mi-02": ["graphRag"],
            },
        }

        filtered = PROFILES_MODULE.filter_hits_for_profile(
            hits,
            case_id="faithfulness-policy-cited",
            profile=profile,
            attribution=attribution,
        )

        self.assertEqual([hit["sourceId"] for hit in filtered], ["rule-kv-01"])

    def test_filter_hits_for_profile_drops_iterative_retry_attribution(self) -> None:
        profile = next(item for item in PROFILES_MODULE.ABLATION_PROFILES if item.key == "iterative-retry-off")
        hits = [
            {"sourceId": "rule-kv-01", "title": "Key Vault"},
            {"sourceId": "rule-mi-02", "title": "Managed Identity"},
        ]
        attribution = {
            "ask-iterative-retry-recall-boost": {
                "rule-mi-02": ["iterativeRetry"],
            },
        }

        filtered = PROFILES_MODULE.filter_hits_for_profile(
            hits,
            case_id="ask-iterative-retry-recall-boost",
            profile=profile,
            attribution=attribution,
        )

        self.assertEqual([hit["sourceId"] for hit in filtered], ["rule-kv-01"])

    def test_iterative_retry_off_reduces_retrieved_hit_count_on_golden_fixture(self) -> None:
        cases_path = Path(__file__).resolve().parents[3] / "tests" / "eval-datasets" / "faithfulness-golden" / "cases.json"
        attribution_path = (
            Path(__file__).resolve().parents[3]
            / "tests"
            / "eval-datasets"
            / "faithfulness-golden"
            / "ablation-attribution.v1.json"
        )
        cases_payload = json.loads(cases_path.read_text(encoding="utf-8"))
        case = next(item for item in cases_payload["cases"] if item["id"] == "ask-iterative-retry-recall-boost")
        attribution = PROFILES_MODULE.load_hit_feature_attribution(json.loads(attribution_path.read_text(encoding="utf-8")))
        all_on = next(item for item in PROFILES_MODULE.ABLATION_PROFILES if item.key == "all-on")
        iterative_off = next(item for item in PROFILES_MODULE.ABLATION_PROFILES if item.key == "iterative-retry-off")

        all_on_hits = PROFILES_MODULE.filter_hits_for_profile(
            case["retrievalHits"],
            case_id=case["id"],
            profile=all_on,
            attribution=attribution,
        )
        iterative_off_hits = PROFILES_MODULE.filter_hits_for_profile(
            case["retrievalHits"],
            case_id=case["id"],
            profile=iterative_off,
            attribution=attribution,
        )

        self.assertEqual(len(all_on_hits), 2)
        self.assertEqual(len(iterative_off_hits), 1)
        self.assertEqual([hit["sourceId"] for hit in iterative_off_hits], ["rule-kv-01"])


if __name__ == "__main__":
    unittest.main()
