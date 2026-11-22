import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from evaluate_securenow_scale_run import evaluate


def fixture():
    metric = lambda values, threshold=None: {"values": values, "thresholds": {threshold: {"ok": True}} if threshold else {}}
    summary = {"metrics": {
        "http_req_failed": metric({"rate": 0.0}, "rate<0.01"),
        "http_req_duration": metric({"p(95)": 80}, "p(95)<3000"),
        "checks": metric({"rate": 1.0}, "rate>0.99"),
        "http_reqs": metric({"count": 500}),
        "http_req_duration{name:snapshot_list}": metric({"p(95)": 50}, "p(95)<3000"),
        "http_req_duration{name:ranked_paths}": metric({"p(95)": 80}, "p(95)<3000"),
    }}
    meta = {"profile": "synthetic-multitenant", "tenantCount": 2,
            "seededPathsPerTenant": 10, "gitSha": "abc123",
            "environment": "isolated-staging",
            "workload": "scripts/load/securenow-multitenant-read.js"}
    return summary, meta


class SecureNowEndpointEvidenceTests(unittest.TestCase):
    def test_complete_evidence_passes(self):
        summary, meta = fixture()
        self.assertEqual(evaluate(summary, meta)["status"], "PASS")

    def test_missing_endpoint_fails(self):
        summary, meta = fixture()
        del summary["metrics"]["http_req_duration{name:ranked_paths}"]
        self.assertEqual(evaluate(summary, meta)["status"], "HOLD")

    def test_slow_endpoint_fails(self):
        summary, meta = fixture()
        summary["metrics"]["http_req_duration{name:snapshot_list}"]["values"]["p(95)"] = 3200
        self.assertEqual(evaluate(summary, meta)["status"], "HOLD")

    def test_nonfinite_latency_fails(self):
        summary, meta = fixture()
        summary["metrics"]["http_req_duration{name:ranked_paths}"]["values"]["p(95)"] = float("nan")
        self.assertEqual(evaluate(summary, meta)["status"], "HOLD")

    def test_missing_threshold_fails(self):
        summary, meta = fixture()
        summary["metrics"]["http_req_duration{name:ranked_paths}"]["thresholds"] = {}
        self.assertEqual(evaluate(summary, meta)["status"], "HOLD")


if __name__ == "__main__":
    unittest.main()
