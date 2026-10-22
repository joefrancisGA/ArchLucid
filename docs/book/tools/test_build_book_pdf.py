"""Tests for the book PDF builder. Run: python -m unittest discover -s docs/book/tools -p "test_*.py"

The source and layout helpers need only the standard library. The end-to-end build needs reportlab,
markdown, and pypdf, and is skipped with a message when any of them is missing.
"""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from datetime import date
from pathlib import Path

from bookpdf.code_wrap import CONTINUATION_INDENT, CONTINUATION_MARKER, wrap_code, wrap_code_line
from bookpdf.sources import (
    book_files,
    clean_markdown,
    is_unbreakable,
    long_code_lines,
    read_readme_field,
    reading_order,
)
from bookpdf.tables import column_widths

PDF_DEPENDENCIES = ("reportlab", "markdown", "pypdf")
MISSING = [name for name in PDF_DEPENDENCIES if importlib.util.find_spec(name) is None]
FENCE = "```"

# Optional dependencies: CI runs this file without them, and the end-to-end class is skipped.
if not MISSING:
    from pypdf import PdfReader

    from bookpdf.builder import build_pdf


def write(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")

    return path


class CleanMarkdownTests(unittest.TestCase):
    SOURCE = (
        "> **Scope:** Chapter scope line.\n"
        "> **Status:** draft\n"
        "\n"
        "# Chapter 1 — Title\n"
        "\n"
        "**Spine:** [`../README.md`](../README.md)\n"
        "\n"
        "> *Draft status: first draft.*\n"
        "\n"
        "Body paragraph.\n"
        "\n"
        "## Author notes (remove before submission)\n"
        "\n"
        "- A note for the author.\n"
    )

    def setUp(self) -> None:
        self.cleaned = clean_markdown(self.SOURCE)

    def test_scope_line_removed(self) -> None:
        self.assertNotIn("**Scope:**", self.cleaned)

    def test_status_line_removed(self) -> None:
        self.assertNotIn("**Status:**", self.cleaned)

    def test_draft_status_line_removed(self) -> None:
        self.assertNotIn("Draft status:", self.cleaned)

    def test_spine_line_removed(self) -> None:
        self.assertNotIn("**Spine:**", self.cleaned)

    def test_author_notes_removed(self) -> None:
        self.assertNotIn("Author notes", self.cleaned)
        self.assertNotIn("A note for the author.", self.cleaned)

    def test_heading_and_body_kept(self) -> None:
        self.assertIn("# Chapter 1 — Title", self.cleaned)
        self.assertIn("Body paragraph.", self.cleaned)

    def test_none_is_empty(self) -> None:
        self.assertEqual(clean_markdown(None), "")

    def test_only_first_status_line_removed(self) -> None:
        text = "> **Status:** draft\n\nBody.\n\n> **Status:** quoted in the body\n"
        self.assertIn("quoted in the body", clean_markdown(text))


class BookFilesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        write(self.root / "back-matter" / "glossary.md", "# Glossary\n")
        write(self.root / "chapters" / "02-second.md", "# Chapter 2\n")
        write(self.root / "chapters" / "01-first.md", "# Chapter 1\n")
        write(self.root / "chapters" / "notes.md", "# Not a chapter\n")
        write(self.root / "appendices" / "b-second.md", "# Appendix B\n")
        write(self.root / "appendices" / "a-first.md", "# Appendix A\n")
        write(self.root / "appendices" / "c-unfinished.md", "# Appendix C\n\n[[OWNER: fill this in]]\n")
        write(self.root / "front-matter" / "preface.md", "# Preface\n")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def names(self, paths: list[Path]) -> list[str]:
        return [path.relative_to(self.root).as_posix() for path in paths]

    def test_reading_order(self) -> None:
        self.assertEqual(
            self.names(reading_order(self.root)),
            [
                "front-matter/preface.md",
                "chapters/01-first.md",
                "chapters/02-second.md",
                "appendices/a-first.md",
                "appendices/b-second.md",
                "appendices/c-unfinished.md",
                "back-matter/glossary.md",
            ],
        )

    def test_unfinished_file_excluded_and_recorded(self) -> None:
        included, excluded = book_files(self.root, include_unfinished=False)
        self.assertNotIn("appendices/c-unfinished.md", self.names(included))
        self.assertEqual(self.names(excluded), ["appendices/c-unfinished.md"])

    def test_unfinished_file_included_on_request(self) -> None:
        included, excluded = book_files(self.root, include_unfinished=True)
        self.assertIn("appendices/c-unfinished.md", self.names(included))
        self.assertEqual(excluded, [])

    def test_missing_front_matter_is_skipped(self) -> None:
        (self.root / "front-matter" / "preface.md").unlink()
        self.assertEqual(self.names(reading_order(self.root))[0], "chapters/01-first.md")

    def test_book_root_required(self) -> None:
        with self.assertRaises(ValueError):
            book_files(None, include_unfinished=False)


class ReadmeFieldTests(unittest.TestCase):
    README = "**Working title:** *A Title*\n**Working subtitle:** *A Subtitle: With Colon*\n"

    def test_reads_title_without_italics(self) -> None:
        self.assertEqual(read_readme_field(self.README, "Working title"), "A Title")

    def test_reads_subtitle_with_colon(self) -> None:
        self.assertEqual(read_readme_field(self.README, "Working subtitle"), "A Subtitle: With Colon")

    def test_missing_field_is_none(self) -> None:
        self.assertIsNone(read_readme_field(self.README, "Outline"))

    def test_empty_readme_is_none(self) -> None:
        self.assertIsNone(read_readme_field("", "Working title"))


class LongCodeLineTests(unittest.TestCase):
    def test_reports_long_fenced_line_with_number(self) -> None:
        text = f"Intro\n\n{FENCE}python\nshort = 1\nx = '{'a' * 120}'\n{FENCE}\n"
        found = long_code_lines(text, limit=100)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0][0], 5)
        self.assertGreater(found[0][1], 100)

    def test_ignores_long_prose(self) -> None:
        self.assertEqual(long_code_lines("word " * 60, limit=100), [])

    def test_ignores_author_notes(self) -> None:
        text = f"Body\n\n## Author notes (remove before submission)\n\n{FENCE}\n{'b' * 150}\n{FENCE}\n"
        self.assertEqual(long_code_lines(text, limit=100), [])

    def test_line_at_limit_is_fine(self) -> None:
        text = f"{FENCE}text\n{'c' * 100}\n{FENCE}\n"
        self.assertEqual(long_code_lines(text, limit=100), [])

    def test_unbreakable_json_string_is_exempt(self) -> None:
        line = '    "claim": "' + "d" * 120 + '",'
        self.assertEqual(long_code_lines(f"{FENCE}json\n{line}\n{FENCE}\n", limit=100), [])

    def test_same_line_in_python_is_reported(self) -> None:
        line = '    "claim": "' + "d" * 120 + '",'
        self.assertEqual(len(long_code_lines(f"{FENCE}python\n{line}\n{FENCE}\n", limit=100)), 1)

    def test_json_line_with_two_values_is_reported(self) -> None:
        line = '{ "id": "H1", "claim": "' + "e" * 120 + '" }'
        self.assertEqual(len(long_code_lines(f"{FENCE}json\n{line}\n{FENCE}\n", limit=100)), 1)

    def test_is_unbreakable_requires_json(self) -> None:
        self.assertTrue(is_unbreakable('"text": "value"', "json"))
        self.assertFalse(is_unbreakable('"text": "value"', "python"))
        self.assertFalse(is_unbreakable('"a": 1, "b": "value"', "json"))


class CodeWrapTests(unittest.TestCase):
    def test_short_line_unchanged(self) -> None:
        self.assertEqual(wrap_code_line("x = 1", 40), ["x = 1"])

    def test_no_piece_wider_than_limit(self) -> None:
        line = "    result = compute(" + ", ".join(f"argument_{i}" for i in range(20)) + ")"
        pieces = wrap_code_line(line, 50)
        self.assertGreater(len(pieces), 1)
        self.assertTrue(all(len(piece) <= 50 for piece in pieces))

    def test_marker_on_every_piece_but_last(self) -> None:
        pieces = wrap_code_line("a " * 60, 30)
        self.assertTrue(all(piece.endswith(CONTINUATION_MARKER) for piece in pieces[:-1]))
        self.assertFalse(pieces[-1].endswith(CONTINUATION_MARKER))

    def test_continuations_indented_past_original(self) -> None:
        pieces = wrap_code_line("        " + "word " * 30, 40)
        self.assertTrue(all(piece.startswith("        " + CONTINUATION_INDENT) for piece in pieces[1:]))

    def test_no_text_lost(self) -> None:
        line = "value = " + "".join(chr(97 + i % 26) for i in range(150))
        pieces = wrap_code_line(line, 40)
        rebuilt = "".join(piece.rstrip(CONTINUATION_MARKER).lstrip(" ") for piece in pieces)
        self.assertEqual(rebuilt, line)

    def test_hard_break_without_spaces(self) -> None:
        pieces = wrap_code_line("x" * 100, 30)
        self.assertTrue(all(len(piece) <= 30 for piece in pieces))

    def test_tabs_expanded(self) -> None:
        self.assertEqual(wrap_code_line("\tx", 40), ["    x"])

    def test_deep_indent_falls_back_to_short_prefix(self) -> None:
        pieces = wrap_code_line(" " * 30 + "y" * 60, 40)
        self.assertTrue(all(piece.startswith(CONTINUATION_INDENT) for piece in pieces[1:]))
        self.assertTrue(all(len(piece) <= 40 for piece in pieces))

    def test_width_too_small_raises(self) -> None:
        with self.assertRaises(ValueError):
            wrap_code_line("anything", 4)

    def test_wrap_code_keeps_blank_lines(self) -> None:
        self.assertEqual(wrap_code("a\n\nb", 40), ["a", "", "b"])

    def test_wrap_code_handles_none(self) -> None:
        self.assertEqual(wrap_code(None, 40), [])


class ColumnWidthTests(unittest.TestCase):
    def test_sum_equals_total(self) -> None:
        widths = column_widths([["Kind", "What it answers"], ["A", "A much longer explanation " * 4]], 500)
        self.assertAlmostEqual(sum(widths), 500)

    def test_longer_column_gets_more(self) -> None:
        widths = column_widths([["Id", "Description"], ["1", "A long description of the thing " * 3]], 500)
        self.assertGreater(widths[1], widths[0])

    def test_bounds_respected(self) -> None:
        rows = [["a", "b", "c"], ["x", "y", "z " * 200]]
        widths = column_widths(rows, 600, min_share=0.1, max_share=0.6)
        for width in widths:
            self.assertGreaterEqual(width, 0.1 * 600 - 1e-6)
            self.assertLessEqual(width, 0.6 * 600 + 1e-6)

    def test_longest_word_not_split(self) -> None:
        rows = [["Hop", "Observed fact"], ["6 (assumptions)", "No deny assignment, no role condition " * 3]]
        widths = column_widths(rows, 500)
        self.assertGreaterEqual(widths[0], len("(assumptions)") * 4.7)

    def test_ragged_rows_padded(self) -> None:
        self.assertEqual(len(column_widths([["a", "b", "c"], ["only one"]], 300)), 3)

    def test_single_column_takes_everything(self) -> None:
        self.assertEqual(column_widths([["only"]], 300), [300])

    def test_empty_rows(self) -> None:
        self.assertEqual(column_widths([], 300), [])

    def test_word_floors_that_overflow_fall_back(self) -> None:
        rows = [["x" * 60, "y" * 60, "z" * 60]]
        widths = column_widths(rows, 300)
        self.assertAlmostEqual(sum(widths), 300)


@unittest.skipIf(MISSING, f"PDF build test needs {', '.join(MISSING)}; install with pip to run it")
class EndToEndBuildTests(unittest.TestCase):
    def test_two_file_book_has_filled_contents(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            first = write(root / "chapters" / "01-alpha.md", "# Chapter Alpha\n\n## Alpha section\n\nText.\n")
            long_code = "x = " + "1 + " * 60 + "1"
            second = write(
                root / "chapters" / "02-beta.md",
                f"# Chapter Beta\n\nText → arrow.\n\n{FENCE}python\n{long_code}\n{FENCE}\n\n"
                "| A | B |\n|---|---|\n| 1 | 2 |\n",
            )
            out = root / "book.pdf"
            pages = build_pdf([first, second], [], out, "Test Book", "A subtitle", date(2026, 10, 11))
            reader = PdfReader(str(out))
            contents = reader.pages[1].extract_text()

            self.assertEqual(pages, len(reader.pages))
            self.assertIn("Chapter Alpha", contents)
            self.assertIn("Chapter Beta", contents)
            self.assertIn("Alpha section", contents)
            self.assertNotIn("Placeholder", contents)
            self.assertEqual([entry.title for entry in reader.outline if not isinstance(entry, list)],
                             ["Chapter Alpha", "Chapter Beta"])


if __name__ == "__main__":
    unittest.main()
