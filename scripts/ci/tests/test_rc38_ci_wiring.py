"""Fail closed when the sole release-candidate full-CI branch wiring drifts."""

from pathlib import Path
import re
import unittest

WORKFLOW = Path(__file__).resolve().parents[3] / ".github" / "workflows" / "ci.yml"


class Rc38CiWiringTests(unittest.TestCase):
    def test_full_non_deploying_ci_pushes_target_rc38_only(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertRegex(workflow, r"(?m)^  push:\n    branches: \[RC38\]$")
        self.assertNotIn("branches: [RC36]", workflow)

    def test_live_azure_openai_cannot_run_on_rc38(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("github.ref != 'refs/heads/RC38'", workflow)
        self.assertNotIn("refs/heads/RC36", workflow)


if __name__ == "__main__":
    unittest.main()
