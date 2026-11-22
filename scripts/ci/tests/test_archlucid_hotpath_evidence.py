import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from evaluate_archlucid_hotpath_evidence import evaluate, REQUIRED_ENDPOINTS


def fixture():
    metrics = {
        "http_req_duration": {"values": {"med": 20, "p(95)": 80, "p(99)": 120}},
        "http_reqs": {"values": {"count": 500, "rate": 30}},
        "checks": {"values": {"rate": 1.0}},
    }
    for endpoint in REQUIRED_ENDPOINTS:
        metrics[f"http_req_duration{{name:{endpoint}}}"] = {"values": {"p(95)": 80}}
    meta = {"gitSha": "abc123", "environment": "isolated-ci",
            "workload": "scripts/load/hotpaths.js", "databaseProfile": "seeded-disposable",
            "runnerProfile": "ubuntu-standard", "vus": 5, "durationSeconds": 120}
    return {"metrics": metrics}, meta


class HotpathEvidenceTests(unittest.TestCase):
    def test_valid_evidence_passes(self):
        summary, meta = fixture()
        self.assertEqual(evaluate(summary, meta)["status"], "pass")

    def test_missing_endpoint_is_invalid(self):
        summary, meta = fixture()
        del summary["metrics"]["http_req_duration{name:create_run}"]
        with self.assertRaisesRegex(ValueError, "MISSING_EVIDENCE"):
            evaluate(summary, meta)

    def test_bad_percentile_is_invalid(self):
        summary, meta = fixture()
        summary["metrics"]["http_req_duration"]["values"]["p(99)"] = 5
        with self.assertRaisesRegex(ValueError, "monotonic"):
            evaluate(summary, meta)

    def test_low_reliability_fails(self):
        summary, meta = fixture()
        summary["metrics"]["checks"]["values"]["rate"] = .94
        self.assertEqual(evaluate(summary, meta)["status"], "fail")

    def test_slow_latency_fails(self):
        summary, meta = fixture()
        summary["metrics"]["http_req_duration"]["values"].update({"p(95)": 2300, "p(99)": 3000})
        self.assertEqual(evaluate(summary, meta)["status"], "fail")

    def test_missing_environment_rejected(self):
        summary, meta = fixture()
        del meta["runnerProfile"]
        with self.assertRaisesRegex(ValueError, "MISSING_EVIDENCE"):
            evaluate(summary, meta)


if __name__ == "__main__":
    unittest.main()
