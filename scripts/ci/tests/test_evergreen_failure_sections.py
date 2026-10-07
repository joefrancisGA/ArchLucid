"""Unit tests for evergreen.failure_sections."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.failure_digest import FailedJob  # noqa: E402
from evergreen.failure_sections import failed_job_block, failed_jobs_section, fence  # noqa: E402


class TestFence(unittest.TestCase):
    def test_plain_text_uses_three_backticks(self) -> None:
        self.assertEqual(fence("hello"), "```text\nhello\n```")

    def test_fence_outgrows_backtick_runs_in_the_text(self) -> None:
        wrapped = fence("a ``` b\n```` c")

        self.assertTrue(wrapped.startswith("`````text\n"))
        self.assertTrue(wrapped.endswith("\n`````"))

    def test_custom_info_string(self) -> None:
        self.assertTrue(fence("x", info="json").startswith("```json\n"))


class TestFailedJobs(unittest.TestCase):
    def test_block_lists_steps_url_and_excerpt(self) -> None:
        job = FailedJob(name="J", failed_steps=["a", "b"], error_lines=["e1", "e2"], url="https://j")

        block = failed_job_block(job)

        self.assertIn("### Job: J", block)
        self.assertIn("Failed steps: a, b", block)
        self.assertIn("Job log: https://j", block)
        self.assertIn("e1\ne2", block)

    def test_block_placeholders_for_empty_job(self) -> None:
        block = failed_job_block(FailedJob(name="J", failed_steps=[], error_lines=[], url="u"))

        self.assertIn("(no step recorded)", block)
        self.assertIn("(no error lines captured)", block)

    def test_budget_keeps_whole_blocks_and_names_the_omitted_jobs(self) -> None:
        jobs = [FailedJob(name, [], ["x" * 100], "u") for name in ("A", "B", "C")]
        one_block = len(failed_job_block(jobs[0]))

        section = failed_jobs_section(jobs, char_budget=one_block * 2 + 10)

        self.assertIn("### Job: A", section)
        self.assertIn("### Job: B", section)
        self.assertNotIn("### Job: C", section)
        self.assertIn("1 more failed job(s) omitted to fit the size limit: C", section)
        self.assertEqual(section.count("```"), 4, "every included block keeps its closing fence")

    def test_budget_smaller_than_one_block_lists_every_job_as_omitted(self) -> None:
        jobs = [FailedJob("A", [], ["x" * 100], "u"), FailedJob("B", [], [], "u")]

        section = failed_jobs_section(jobs, char_budget=10)

        self.assertNotIn("### Job:", section)
        self.assertIn("2 more failed job(s) omitted", section)
        self.assertIn("A, B", section)

    def test_budget_that_fits_everything_adds_no_note(self) -> None:
        jobs = [FailedJob("A", [], [], "u")]

        self.assertEqual(failed_jobs_section(jobs, char_budget=10_000), failed_jobs_section(jobs))

    def test_section_joins_blocks(self) -> None:
        jobs = [FailedJob("A", [], [], "u"), FailedJob("B", [], [], "u")]

        section = failed_jobs_section(jobs)

        self.assertLess(section.index("### Job: A"), section.index("### Job: B"))
        self.assertEqual(failed_jobs_section([]), "")


if __name__ == "__main__":
    unittest.main()
