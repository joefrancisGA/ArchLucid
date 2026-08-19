"""Unit tests for ``check_reference_customer_status``.

Run with::

    python -m unittest scripts/ci/test_check_reference_customer_status.py
"""

from __future__ import annotations

import pathlib
import tempfile
import unittest

from check_reference_customer_status import (
    PUBLISHED_STATUS_TOKEN,
    check,
    main,
    parse_reference_table,
)

_TABLE_HEADER: str = (
    "| Customer | Tier | Pilot start | Case-study link | Reference-call cadence | Status |\n"
    "|----------|------|-------------|-----------------|------------------------|--------|\n"
)


def _make_doc(rows_markdown: str = "") -> str:
    return (
        "# header\n\n"
        "Some prose.\n\n"
        + _TABLE_HEADER
        + rows_markdown
        + "\n\nMore prose afterwards.\n"
    )


class CheckHelperTests(unittest.TestCase):
    def test_returns_false_when_no_rows(self) -> None:
        self.assertFalse(check([]))

    def test_returns_false_when_only_placeholder(self) -> None:
        self.assertFalse(check([{"status": "Placeholder - replace before publishing"}]))

    def test_returns_true_when_one_published(self) -> None:
        self.assertTrue(check([
            {"status": "Drafting"},
            {"status": "Published"},
            {"status": "Placeholder"},
        ]))

    def test_is_case_insensitive(self) -> None:
        self.assertTrue(check([{"status": "PUBLISHED"}]))
        self.assertTrue(check([{"status": "published"}]))
        self.assertTrue(check([{"status": "  Published  "}]))

    def test_handles_status_with_trailing_comment(self) -> None:
        # Real-world: "Published - 2026-Q3 customer X" should still count.
        self.assertTrue(check([{"status": "Published - 2026-Q3 customer X"}]))

    def test_drafting_does_not_count_as_published(self) -> None:
        self.assertFalse(check([{"status": "Drafting"}]))

    def test_customer_review_does_not_count_as_published(self) -> None:
        self.assertFalse(check([{"status": "Customer review"}]))

    def test_handles_missing_status_key(self) -> None:
        self.assertFalse(check([{}]))

    def test_skips_none_rows(self) -> None:
        self.assertTrue(check([None, {"status": "Published"}]))  # type: ignore[list-item]

    def test_raises_on_none_rows_arg(self) -> None:
        with self.assertRaises(ValueError):
            check(None)  # type: ignore[arg-type]


class ParseReferenceTableTests(unittest.TestCase):
    def test_parses_single_placeholder_row(self) -> None:
        doc = _make_doc(
            "| EXAMPLE_DESIGN_PARTNER | Professional | TBD | [link](file.md) | TBD | Placeholder |\n"
        )

        rows = parse_reference_table(doc)

        self.assertEqual(1, len(rows))
        self.assertEqual("EXAMPLE_DESIGN_PARTNER", rows[0]["customer"])
        self.assertEqual("Placeholder", rows[0]["status"])

    def test_parses_multiple_rows(self) -> None:
        doc = _make_doc(
            "| AcmeCorp | Professional | 2026-Q1 | [link](a.md) | Quarterly | Drafting |\n"
            "| BetaInc | Team | 2026-Q2 | [link](b.md) | Quarterly | Published |\n"
        )

        rows = parse_reference_table(doc)

        self.assertEqual(2, len(rows))
        self.assertEqual("BetaInc", rows[1]["customer"])
        self.assertEqual("Published", rows[1]["status"])

    def test_stops_at_blank_line_after_table(self) -> None:
        doc = _make_doc(
            "| AcmeCorp | Professional | 2026-Q1 | [link](a.md) | Quarterly | Drafting |\n"
        )

        rows = parse_reference_table(doc)

        self.assertEqual(1, len(rows))

    def test_raises_on_missing_table(self) -> None:
        with self.assertRaises(ValueError):
            parse_reference_table("# Header\n\nNo table here.\n")

    def test_raises_on_column_count_mismatch(self) -> None:
        # 5 cells where the header has 6 columns.
        bad_doc = (
            _TABLE_HEADER
            + "| only | three | cells | here | sorry |\n"
        )
        with self.assertRaises(ValueError):
            parse_reference_table(bad_doc)

    def test_raises_on_none_input(self) -> None:
        with self.assertRaises(ValueError):
            parse_reference_table(None)  # type: ignore[arg-type]


class MainTests(unittest.TestCase):
    def _write(self, body: str) -> pathlib.Path:
        tmp = pathlib.Path(tempfile.mkdtemp()) / "README.md"
        tmp.write_text(body, encoding="utf-8")
        return tmp

    def test_exit_code_1_when_no_published_rows(self) -> None:
        path = self._write(_make_doc(
            "| EXAMPLE_DESIGN_PARTNER | Professional | TBD | [link](file.md) | TBD | Placeholder |\n"
        ))

        result = main([str(path)])

        self.assertEqual(1, result)

    def test_exit_code_0_when_published_row_present(self) -> None:
        path = self._write(_make_doc(
            "| AcmeCorp | Professional | 2026-Q1 | [link](a.md) | Quarterly | Published |\n"
        ))

        result = main([str(path)])

        self.assertEqual(0, result)

    def test_exit_code_2_when_file_missing(self) -> None:
        result = main(["/no/such/file/that/exists.md"])

        self.assertEqual(2, result)

    def test_exit_code_2_when_table_missing(self) -> None:
        path = self._write("# header\n\nNo table.\n")

        result = main([str(path)])

        self.assertEqual(2, result)


class PublishedTokenTests(unittest.TestCase):
    def test_token_is_lowercase(self) -> None:
        # Sanity: catches a typo if someone changes the constant later.
        self.assertEqual("published", PUBLISHED_STATUS_TOKEN)


if __name__ == "__main__":
    unittest.main()
