"""Fail closed when the sole release-candidate full-CI branch wiring drifts."""

from pathlib import Path
import re
import unittest

WORKFLOW = Path(__file__).resolve().parents[3] / ".github" / "workflows" / "ci.yml"


class Rc41CiWiringTests(unittest.TestCase):
    def test_full_non_deploying_ci_pushes_target_rc41_only(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertRegex(workflow, r"(?m)^  push:\n    branches: \[RC41\]$")
        self.assertNotIn("branches: [RC40]", workflow)
        self.assertNotIn("branches: [RC36]", workflow)

    def test_live_azure_openai_cannot_run_on_rc41(self) -> None:
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("github.ref != 'refs/heads/RC41'", workflow)
        self.assertNotIn("github.ref != 'refs/heads/RC40'", workflow)
        self.assertNotIn("refs/heads/RC36", workflow)


    def test_vitest_cohorts_cover_every_test_file_without_skips(self) -> None:
        """Four required shards must collectively run all 64 disjoint cohorts."""
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn('first_shard="$((16 * (shard_index - 1) + 1))"', workflow)
        self.assertIn('last_shard="$((16 * shard_index))"', workflow)
        self.assertIn('--shard="${shard_in_cohort}/64"', workflow)
        self.assertIn("failed=1", workflow)
        self.assertIn('exit "${failed}"', workflow)
        cohorts = [
            cohort
            for shard_index in range(1, 5)
            for cohort in range(16 * (shard_index - 1) + 1, 16 * shard_index + 1)
        ]
        self.assertEqual(cohorts, list(range(1, 65)))


if __name__ == "__main__":
    unittest.main()
