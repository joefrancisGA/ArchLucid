"""Unit tests for check_roi_model_freshness.py."""

from __future__ import annotations

import datetime as dt
import unittest

from check_roi_model_freshness import check_last_reviewed, extract_last_reviewed  # noqa: E402


class TestCheckRoiModelFreshness(unittest.TestCase):
    def test_extract_last_reviewed_parses_date(self) -> None:
        text = "**Last reviewed:** 2026-06-02\n"
        parsed = extract_last_reviewed(text)
        self.assertEqual(parsed, dt.date(2026, 6, 2))

    def test_check_warns_when_missing(self) -> None:
        messages = check_last_reviewed(None, dt.date(2026, 6, 2))
        self.assertEqual(len(messages), 1)
        self.assertIn("missing", messages[0].lower())

    def test_check_warns_when_stale(self) -> None:
        messages = check_last_reviewed(dt.date(2026, 1, 1), dt.date(2026, 6, 2))
        self.assertEqual(len(messages), 1)
        self.assertIn("WARN", messages[0])

    def test_check_ok_when_fresh(self) -> None:
        messages = check_last_reviewed(dt.date(2026, 5, 1), dt.date(2026, 6, 2))
        self.assertEqual(messages, [])


if __name__ == "__main__":
    unittest.main()
