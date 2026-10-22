"""Unit tests for evergreen.pull_request_record."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.pull_request_record import PullRequestRecord  # noqa: E402


def _payload(**overrides: object) -> dict[str, object]:
    return {"number": 5, "title": "T", "body": "B", "state": "closed", "merged_at": None, "closed_at": None, **overrides}


class TestPullRequestRecord(unittest.TestCase):
    def test_from_api_parses_times_and_defaults_nulls(self) -> None:
        record = PullRequestRecord.from_api(
            _payload(body=None, title=None, merged_at="2026-10-06T16:36:21Z", closed_at="2026-10-06T16:36:22Z")
        )

        self.assertEqual(record.number, 5)
        self.assertEqual(record.title, "")
        self.assertEqual(record.body, "")
        self.assertEqual(record.merged_at, datetime(2026, 10, 6, 16, 36, 21, tzinfo=timezone.utc))
        self.assertEqual(record.settled_at, record.merged_at)

    def test_open_pr_has_no_settled_time(self) -> None:
        record = PullRequestRecord.from_api(_payload(state="open"))

        self.assertTrue(record.is_open)
        self.assertIsNone(record.settled_at)

    def test_closed_unmerged_pr_settles_at_close_time(self) -> None:
        record = PullRequestRecord.from_api(_payload(closed_at="2026-10-06T10:00:00Z"))

        self.assertFalse(record.is_open)
        self.assertEqual(record.settled_at, datetime(2026, 10, 6, 10, 0, tzinfo=timezone.utc))

    def test_escalation_is_recognised_by_title_prefix_ignoring_case_and_whitespace(self) -> None:
        self.assertTrue(PullRequestRecord.from_api(_payload(title="NEEDS OWNER: gitleaks")).is_escalation)
        self.assertTrue(PullRequestRecord.from_api(_payload(title="  needs owner: x")).is_escalation)
        self.assertFalse(PullRequestRecord.from_api(_payload(title="Evergreen: fix")).is_escalation)


if __name__ == "__main__":
    unittest.main()
