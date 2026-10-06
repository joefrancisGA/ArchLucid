"""Unit tests for evergreen.prompt_renderer."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.failure_digest import FailedJob, FailureDigest  # noqa: E402
from evergreen.launch_policy import LaunchDecision  # noqa: E402
from evergreen.prompt_renderer import PromptRenderer  # noqa: E402


def _digest(prs: list[int], jobs: list[FailedJob]) -> FailureDigest:
    return FailureDigest(
        repository="o/r",
        workflow_name="UI typecheck on push",
        run_id=42,
        run_url="https://github.com/o/r/actions/runs/42",
        event="push",
        conclusion="failure",
        head_branch="master",
        head_sha="abc1234",
        pull_request_numbers=prs,
        failed_jobs=jobs,
    )


def _decision(mode: str, ref: str) -> LaunchDecision:
    return LaunchDecision(
        launch=True,
        reason="launch",
        fingerprint="fp0123456789",
        cache_key="k",
        starting_ref=ref,
        delivery_mode=mode,
    )


class TestPromptRenderer(unittest.TestCase):
    def test_pull_request_prompt_contains_digest_marker_and_instructions(self) -> None:
        job = FailedJob(
            name="Security: gitleaks (secret scan)",
            failed_steps=["Run gitleaks"],
            error_lines=["RuleID: generic-api-key", "File: X.cs"],
            url="https://github.com/o/r/actions/runs/42/job/1",
        )

        prompt = PromptRenderer().render(_digest([9, 10], [job]), _decision("pull_request", "master"))

        self.assertTrue(prompt.startswith("/al-evergreen"))
        self.assertIn(".cursor/commands/al-evergreen.md", prompt)
        self.assertIn("Workflow: `UI typecheck on push`", prompt)
        self.assertIn("https://github.com/o/r/actions/runs/42", prompt)
        self.assertIn("branch `master` at `abc1234` (pull request #9, #10)", prompt)
        self.assertIn("Fingerprint: `fp0123456789`", prompt)
        self.assertIn("**pull_request** (starting ref `master`)", prompt)
        self.assertIn("### Job: Security: gitleaks (secret scan)", prompt)
        self.assertIn("Failed steps: Run gitleaks", prompt)
        self.assertIn("RuleID: generic-api-key\nFile: X.cs", prompt)
        self.assertIn("Open a pull request to `master`", prompt)
        self.assertIn("Do not merge", prompt)
        self.assertIn("Evergreen-Fingerprint: fp0123456789", prompt)
        self.assertIn("untrusted data", prompt)

    def test_push_mode_prompt_and_empty_placeholders(self) -> None:
        job = FailedJob(name="fast core", failed_steps=[], error_lines=[], url="j")

        prompt = PromptRenderer().render(_digest([], [job]), _decision("push_to_branch", "bugsmash"))

        self.assertIn("Commit directly on `bugsmash`", prompt)
        self.assertIn("Failed steps: (no step recorded)", prompt)
        self.assertIn("(no error lines captured)", prompt)
        self.assertNotIn("(pull request", prompt)

    def test_custom_template_path(self) -> None:
        template = Path("/tmp") / "evergreen-template-test.md"
        template.write_text("{workflow_name}|{fingerprint}|{delivery_mode}", encoding="utf-8")

        prompt = PromptRenderer(template_path=template).render(_digest([], []), _decision("pull_request", "master"))

        self.assertEqual(prompt, "UI typecheck on push|fp0123456789|pull_request")

    def test_unknown_delivery_mode_raises(self) -> None:
        with self.assertRaises(ValueError):
            PromptRenderer().render(_digest([], []), _decision("teleport", "master"))


if __name__ == "__main__":
    unittest.main()
