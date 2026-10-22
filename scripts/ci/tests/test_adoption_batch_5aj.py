"""TB-238 wizard baseline metrics drift guards (Batch 5AJ)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AJ(unittest.TestCase):
    def test_tb_238_baseline_metrics_step_component(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "components"
            / "wizard"
            / "steps"
            / "WizardStepBaselineMetrics.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("Baseline metrics (for ROI reporting)", text)
        self.assertIn("wizard-baseline-review-cycle-hours", text)
        self.assertNotIn("wizard-baseline-metrics-skip", text)

    def test_tb_238_save_helper_targets_tenant_baseline(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "save-tenant-review-cycle-baseline.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("/v1/tenant/baseline", text)
        self.assertIn("baselineReviewCycleHours", text)

    def test_tb_238_new_run_wizard_wires_baseline_step(self) -> None:
        reviews_new_dir = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "new"
        )
        wizard_lib_paths = (
            REPO_ROOT / "archlucid-ui" / "src" / "lib" / "wizard-step-fields.ts",
            REPO_ROOT / "archlucid-ui" / "src" / "lib" / "use-wizard-baseline-metrics-actions.ts",
        )
        text = "".join(
            path.read_text(encoding="utf-8")
            for path in sorted(reviews_new_dir.glob("**/*"))
            if path.is_file() and path.suffix in {".ts", ".tsx"}
        ) + "".join(path.read_text(encoding="utf-8") for path in wizard_lib_paths)
        self.assertIn("WizardStepBaselineMetrics", text)
        self.assertIn("FULL_WIZARD_BASELINE_METRICS_STEP_INDEX", text)
        self.assertIn("persistBaselineMetricsIfNeeded", text)
        self.assertIn("useWizardBaselineMetricsActions", text)

    def test_tb_238_vitest_covers_baseline_metrics_flow(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "new"
            / "NewRunWizardClient.baseline-metrics.test.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("wizard-baseline-metrics-step", text)
        self.assertIn("saveTenantReviewCycleBaseline", text)

    def test_tb_238_first_pilot_operator_path_references_wizard_step(self) -> None:
        path = REPO_ROOT / "docs" / "runbooks" / "FIRST_PILOT_OPERATOR_PATH.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Baseline metrics", text)
        self.assertIn("/reviews/new", text)


if __name__ == "__main__":
    unittest.main()
