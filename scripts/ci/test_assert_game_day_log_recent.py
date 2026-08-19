"""Unit tests for ``assert_game_day_log_recent``."""

from __future__ import annotations

import contextlib
import io
import unittest
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory

from assert_game_day_log_recent import (
    CalendarRow,
    assert_closing_report_exists,
    most_recent_past_date,
    parse_calendar_rows,
)


class ParseCalendarRowsTests(unittest.TestCase):
    def test_parses_bold_date_and_last_md_link(self) -> None:
        text = """
| Date | Link |
|------|------|
| **2026-04-29** | x | [a](other.md) | [close](2026-04-29.md) |
| 2026-07-29 | [b](2026-07-29.md) |
"""
        rows = parse_calendar_rows(text)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0].on_date, date(2026, 4, 29))
        self.assertEqual(rows[0].report_rel, "2026-04-29.md")
        self.assertEqual(rows[1].report_rel, "2026-07-29.md")


class MostRecentPastDateTests(unittest.TestCase):
    def test_none_when_all_future(self) -> None:
        rows = [CalendarRow(date(2030, 1, 1), "x.md")]
        self.assertIsNone(most_recent_past_date(rows, date(2026, 1, 1)))

    def test_picks_latest_past(self) -> None:
        rows = [
            CalendarRow(date(2026, 1, 1), "a.md"),
            CalendarRow(date(2026, 6, 1), "b.md"),
            CalendarRow(date(2026, 12, 1), "c.md"),
        ]
        got = most_recent_past_date(rows, date(2026, 7, 1))
        self.assertIsNotNone(got)
        assert got is not None
        self.assertEqual(got.on_date, date(2026, 6, 1))


class AssertClosingReportExistsTests(unittest.TestCase):
    def test_skips_when_no_past_dates(self) -> None:
        with TemporaryDirectory() as tmp:
            d = Path(tmp)
            rows = [CalendarRow(date(2099, 1, 1), "missing.md")]
            assert_closing_report_exists(rows, date(2026, 1, 1), d)

    def test_passes_when_file_exists(self) -> None:
        with TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / "report.md").write_text("ok", encoding="utf-8")
            rows = [CalendarRow(date(2020, 1, 1), "report.md")]
            assert_closing_report_exists(rows, date(2026, 1, 1), d)

    def test_fails_when_file_missing(self) -> None:
        with TemporaryDirectory() as tmp:
            d = Path(tmp)
            rows = [CalendarRow(date(2020, 1, 1), "nope.md")]
            buf = io.StringIO()
            with contextlib.redirect_stderr(buf):
                with self.assertRaises(SystemExit):
                    assert_closing_report_exists(rows, date(2026, 1, 1), d)
            self.assertIn("ERROR:", buf.getvalue())


if __name__ == "__main__":
    unittest.main()
