"""Tests for scripts/ci/read_golden_cohort_deployment_name.py."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.ci.read_golden_cohort_deployment_name import read_deployment_name

REPO_ROOT = Path(__file__).resolve().parents[3]


class ReadGoldenCohortDeploymentNameTests(unittest.TestCase):
    def test_committed_budget_config_deployment(self) -> None:
        config = REPO_ROOT / "tests" / "golden-cohort" / "budget.config.json"
        self.assertEqual(read_deployment_name(config_path=config), "archlucid-golden-cohort")

    def test_missing_file_falls_back(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            missing = Path(tmp) / "budget.config.json"
            self.assertEqual(read_deployment_name(config_path=missing), "archlucid-golden-cohort")

    def test_empty_deployment_falls_back(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "budget.config.json"
            path.write_text(json.dumps({"deploymentName": "  "}), encoding="utf-8")
            self.assertEqual(read_deployment_name(config_path=path), "archlucid-golden-cohort")


if __name__ == "__main__":
    unittest.main()
