"""Self-test for ``scripts/ci/assert_golden_cohort_job_names.py``."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT_DIR = REPO_ROOT / "scripts" / "ci"
sys.path.insert(0, str(SCRIPT_DIR))

from assert_golden_cohort_job_names import check_workflow_text  # noqa: E402


VALID_WORKFLOW = """\
name: golden-cohort-nightly
concurrency:
  group: golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
jobs:
  cohort-contract:
    runs-on: ubuntu-latest
  cohort-faithfulness-phase-b-warn:
    needs: cohort-contract
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
  cohort-rag-live-model-faithfulness:
    needs: cohort-contract
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
  cohort-simulator-drift:
    needs: cohort-contract
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
  cohort-real-llm-gate:
    needs: cohort-contract
    runs-on: ubuntu-latest
  cohort-real-mode-eval-corpus:
    needs: cohort-real-llm-gate
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
"""


class GoldenCohortJobNamesTests(unittest.TestCase):
    def test_real_repo_workflow_passes(self) -> None:
        path = REPO_ROOT / ".github" / "workflows" / "golden-cohort-nightly.yml"
        errors = check_workflow_text(path.read_text(encoding="utf-8"))
        self.assertEqual(errors, [])

    def test_fixture_with_pr_skip_on_heavy_jobs_passes(self) -> None:
        errors = check_workflow_text(VALID_WORKFLOW)
        self.assertEqual(errors, [])

    def test_missing_pr_skip_on_heavy_job_fails(self) -> None:
        text = VALID_WORKFLOW.replace(
            "  cohort-simulator-drift:\n    needs: cohort-contract\n    if: github.event_name != 'pull_request'\n",
            "  cohort-simulator-drift:\n    needs: cohort-contract\n",
        )
        errors = check_workflow_text(text)
        self.assertTrue(any("cohort-simulator-drift" in item for item in errors))

    def test_pr_skip_on_required_gate_fails(self) -> None:
        text = VALID_WORKFLOW.replace(
            "  cohort-real-llm-gate:\n    needs: cohort-contract\n",
            "  cohort-real-llm-gate:\n    needs: cohort-contract\n    if: github.event_name != 'pull_request'\n",
        )
        errors = check_workflow_text(text)
        self.assertTrue(any("cohort-real-llm-gate" in item for item in errors))

    def test_preflight_id_still_rejected(self) -> None:
        text = VALID_WORKFLOW.replace("cohort-real-llm-gate:", "cohort-real-llm-preflight:")
        errors = check_workflow_text(text)
        self.assertTrue(any("preflight" in item for item in errors))

    def test_workflow_name_does_not_satisfy_concurrency_group(self) -> None:
        text = VALID_WORKFLOW.replace(
            "concurrency:\n"
            "  group: golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}\n"
            "  cancel-in-progress: true\n",
            "",
        )
        errors = check_workflow_text(text)
        self.assertTrue(any("concurrency" in item for item in errors))

    def test_missing_concurrency_group_fails_even_when_cancel_is_true(self) -> None:
        text = VALID_WORKFLOW.replace(
            "  group: golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}\n",
            "",
        )
        errors = check_workflow_text(text)
        self.assertTrue(any("concurrency.group" in item for item in errors))

    def test_job_level_cancel_in_progress_does_not_count(self) -> None:
        text = VALID_WORKFLOW.replace(
            "concurrency:\n"
            "  group: golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}\n"
            "  cancel-in-progress: true\n",
            "concurrency:\n"
            "  group: golden-cohort-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}\n",
        )
        text = text.replace(
            "  cohort-contract:\n    runs-on: ubuntu-latest\n",
            "  cohort-contract:\n    cancel-in-progress: true\n    runs-on: ubuntu-latest\n",
        )
        errors = check_workflow_text(text)
        self.assertTrue(any("cancel-in-progress" in item for item in errors))

    def test_concurrency_block_allows_comments(self) -> None:
        text = VALID_WORKFLOW.replace(
            "concurrency:\n  group:",
            "concurrency:\n  # queue relief\n  group:",
        )
        errors = check_workflow_text(text)
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
