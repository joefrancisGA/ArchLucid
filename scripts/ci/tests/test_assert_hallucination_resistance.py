"""TB-257 drift guard — assert_hallucination_resistance.py wiring."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAssertHallucinationResistance(unittest.TestCase):
    def test_script_and_nightly_workflow_exist(self) -> None:
        script = REPO_ROOT / "scripts" / "ci" / "assert_hallucination_resistance.py"
        workflow = REPO_ROOT / ".github" / "workflows" / "golden-cohort-expanded-nightly.yml"
        self.assertTrue(script.is_file())
        workflow_text = workflow.read_text(encoding="utf-8")
        self.assertIn("assert_hallucination_resistance.py", workflow_text)

    def test_three_new_adversarial_scenarios_registered(self) -> None:
        manifest = (REPO_ROOT / "tests" / "eval-corpus" / "manifest.json").read_text(encoding="utf-8")
        for slug in (
            "adversarial/fabricated-sku/scenario.json",
            "adversarial/invented-compliance-framework/scenario.json",
            "adversarial/phantom-dependency/scenario.json",
        ):
            self.assertIn(slug, manifest)


if __name__ == "__main__":
    unittest.main()
