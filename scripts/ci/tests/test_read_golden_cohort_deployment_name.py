"""Tests for scripts/ci/read_golden_cohort_deployment_name.py."""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_SCRIPT_PATH = REPO_ROOT / "scripts" / "ci" / "read_golden_cohort_deployment_name.py"

# Load the module from a specific path without mutating sys.path.
_spec = importlib.util.spec_from_file_location("read_golden_cohort_deployment_name", _SCRIPT_PATH)
_mod = importlib.util.module_from_spec(_spec)  # type: ignore[arg-type]
_spec.loader.exec_module(_mod)  # type: ignore[union-attr]
read_deployment_name = _mod.read_deployment_name


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
