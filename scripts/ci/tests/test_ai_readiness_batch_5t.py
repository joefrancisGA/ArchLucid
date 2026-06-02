"""TB-180 calibrated agent confidence drift guards (Batch 5T)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5T(unittest.TestCase):
    def test_tb_180_calibrator_interface_and_implementation_exist(self) -> None:
        interface_path = REPO_ROOT / "ArchLucid.Application" / "Agents" / "IAgentConfidenceCalibrator.cs"
        impl_path = REPO_ROOT / "ArchLucid.Application" / "Agents" / "AgentConfidenceCalibrator.cs"
        self.assertTrue(interface_path.is_file(), f"Missing {interface_path}")
        self.assertTrue(impl_path.is_file(), f"Missing {impl_path}")
        text = impl_path.read_text(encoding="utf-8")
        self.assertIn("BuildIsotonicKnots", text)
        self.assertIn("MinimumSamplesForCalibration", text)

    def test_tb_180_calibrated_confidence_column_and_patch_exist(self) -> None:
        contract_path = REPO_ROOT / "ArchLucid.Contracts" / "Agents" / "AgentResult.cs"
        repo_path = REPO_ROOT / "ArchLucid.Persistence" / "Data" / "Repositories" / "AgentResultRepository.cs"
        contract_text = contract_path.read_text(encoding="utf-8")
        repo_text = repo_path.read_text(encoding="utf-8")
        self.assertIn("CalibratedConfidence", contract_text)
        self.assertIn("PatchCalibratedConfidenceAsync", repo_text)

    def test_tb_180_fail_open_minimum_sample_default_is_twenty(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "AgentConfidenceCalibrationOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("MinimumSamplesForCalibration", text)
        self.assertIn("= 20", text)

    def test_tb_180_calibrator_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Agents" / "AgentConfidenceCalibratorTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("CalibrateAsync_with_insufficient_samples_returns_raw_confidence", text)
        self.assertIn("Evaluate_uses_calibrated_confidence_for_semantic_floor_when_present", text)

    def test_tb_180_calibrator_dependency_guard_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Agents" / "AgentConfidenceCalibratorDependencyTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")


if __name__ == "__main__":
    unittest.main()
