"""Test evidence validation and cost accounting for the FND-085 advisory report."""
from decimal import Decimal
import importlib.util
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "report_fnd085_projection_calibration.py"
spec = importlib.util.spec_from_file_location("projection_calibration", SCRIPT)
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)


class Fnd085ProjectionCalibrationTests(unittest.TestCase):
    def sample(self):
        return {
            "schema": 1, "windowSeconds": 3600, "provider": "fixture", "currency": "USD",
            "providerEvidence": "synthetic", "storageEncoding": "binary",
            "minNodes": 2048, "maxNodes": 4096, "droppedObservations": 0,
            "encodeWriteCostPerArtifact": Decimal("0.01"), "validateReadCostPerHit": Decimal("0.02"),
            "recomputeCostPerHit": Decimal("0.05"), "retentionCostPerGiBHour": Decimal("1.00"),
            "minimumBillableHours": 1,
            "cohorts": [{"eventId": "event-a", "nodes": 2048, "repeats": 3, "binaryBytes": 300000}],
        }

    def test_cost_includes_verified_reads_writes_and_retention(self):
        result = report.calibrate(self.sample())
        self.assertEqual(result["status"], "CANDIDATE_FOR_REVIEW")
        self.assertEqual(result["observedRepeatOpportunities"], 3)
        expected = Decimal("0.01") + Decimal("0.06") + Decimal(300000) / report.GIB
        self.assertEqual(Decimal(result["storageCost"]), expected)

    def test_base64_and_minimum_retention_count_and_zero_hits_force_recompute(self):
        sample = self.sample()
        sample["storageEncoding"] = "base64"
        sample["minimumBillableHours"] = 12
        sample["cohorts"][0]["repeats"] = 0
        result = report.calibrate(sample)
        self.assertEqual(result["status"], "RECOMPUTE")
        self.assertEqual(Decimal(result["retentionCost"]), Decimal(400000) * 12 / report.GIB)

    def test_dropped_or_empty_observations_do_not_support_a_candidate(self):
        sample = self.sample()
        sample["droppedObservations"] = 1
        self.assertEqual(report.calibrate(sample)["status"], "INCOMPLETE")
        sample["cohorts"] = []
        self.assertEqual(report.calibrate(sample)["status"], "NOT_MEASURED")

    def test_duplicate_out_of_band_and_unpriced_evidence_are_rejected(self):
        sample = self.sample()
        sample["cohorts"] *= 2
        with self.assertRaisesRegex(ValueError, "duplicate"):
            report.calibrate(sample)
        sample = self.sample()
        sample["cohorts"][0]["nodes"] = 1024
        with self.assertRaisesRegex(ValueError, "nodes"):
            report.calibrate(sample)
        sample = self.sample()
        sample["retentionCostPerGiBHour"] = None
        with self.assertRaisesRegex(ValueError, "retention"):
            report.calibrate(sample)


if __name__ == "__main__":
    unittest.main()
