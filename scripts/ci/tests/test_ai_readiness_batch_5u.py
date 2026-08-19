"""TB-181 template eval harness nightly cron drift guards (Batch 5U)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5U(unittest.TestCase):
    def test_tb_181_nightly_cron_in_workflow(self) -> None:
        path = REPO_ROOT / ".github" / "workflows" / "template-eval-harness.yml"
        text = path.read_text(encoding="utf-8")
        self.assertIn("schedule:", text)
        self.assertIn('cron: "0 3 * * *"', text)

    def test_tb_181_score_step_emits_json_summary_and_annotations(self) -> None:
        path = REPO_ROOT / ".github" / "workflows" / "template-eval-harness.yml"
        text = path.read_text(encoding="utf-8")
        self.assertIn("--json-summary", text)
        self.assertIn("eval-harness-summary.json", text)
        self.assertIn("--emit-annotations", text)
        self.assertIn("templates-pack-eval-summary", text)

    def test_tb_181_harness_script_supports_json_summary_and_annotations(self) -> None:
        path = REPO_ROOT / "scripts" / "ci" / "eval_template_harness.py"
        text = path.read_text(encoding="utf-8")
        self.assertIn('"--json-summary"', text)
        self.assertIn('"--emit-annotations"', text)
        self.assertIn("def _format_json_summary", text)
        self.assertIn("def emit_github_warning_annotations", text)


if __name__ == "__main__":
    unittest.main()
