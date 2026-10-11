"""Tests for check_listings.py, the gate that keeps book listings equal to their tested sources."""

from __future__ import annotations

import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from check_listings import (
    check_file,
    comment_text,
    fenced_block_after,
    first_difference,
    main,
    normalized,
    region_lines,
    unmarked_python_blocks,
)

SOURCE = "\n".join([
    '"""Module docstring."""',
    "# region greet",
    "def greet() -> str:",
    '    return "hi"',
    "# endregion greet",
    "",
]) + "\n"
MARKER = "<!-- listing: lab/listings/python/demo.py#greet -->"


class TempBook:
    """A throwaway docs/book with one listing module and one chapter."""

    def __init__(self, chapter: str, source: str = SOURCE) -> None:
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name)
        (self.root / "lab" / "listings" / "python").mkdir(parents=True)
        (self.root / "lab" / "listings" / "python" / "demo.py").write_text(source, encoding="utf-8")
        (self.root / "chapters").mkdir()
        self.chapter = self.root / "chapters" / "01-demo.md"
        self.chapter.write_text(chapter, encoding="utf-8")

    def close(self) -> None:
        self.folder.cleanup()


def chapter_with(block: str, marker: str = MARKER) -> str:
    return f"# Demo\n\n{marker}\n\n```python\n{block}```\n"


class Helpers(unittest.TestCase):
    def test_normalized_trims_blank_edges_and_trailing_space(self) -> None:
        self.assertEqual(normalized(["", "a  ", "", "b", "", ""]), ["a", "", "b"])

    def test_region_lines(self) -> None:
        lines = SOURCE.splitlines()

        self.assertEqual(region_lines(lines, "greet"), ["def greet() -> str:", '    return "hi"'])
        self.assertIs(region_lines(lines, None), lines)
        self.assertIsNone(region_lines(lines, "missing"))

    def test_comment_text(self) -> None:
        self.assertEqual(comment_text("  # region tag"), "region tag")
        self.assertEqual(comment_text("// endregion q"), "endregion q")
        self.assertIsNone(comment_text("resources"))

    def test_region_with_slash_comments(self) -> None:
        lines = ["// region q", "resources", "| take 1", "// endregion q"]

        self.assertEqual(region_lines(lines, "q"), ["resources", "| take 1"])

    def test_region_is_dedented(self) -> None:
        lines = ['resource "a" "b" {', "  # region tags", "  tags = {", "    owner = 1", "  }",
                 "  # endregion tags", "}"]

        self.assertEqual(region_lines(lines, "tags"), ["tags = {", "  owner = 1", "}"])

    def test_region_without_end_is_missing(self) -> None:
        self.assertIsNone(region_lines(["# region open", "x = 1"], "open"))
        self.assertIsNone(region_lines(["# endregion late", "# region late", "x = 1"], "late"))

    def test_fenced_block_after(self) -> None:
        lines = ["marker", "", "```python", "x = 1", "```"]

        self.assertEqual(fenced_block_after(lines, 0), (3, ["x = 1"]))
        self.assertIsNone(fenced_block_after(["marker", "text"], 0))
        self.assertIsNone(fenced_block_after(["marker"], 0))
        self.assertIsNone(fenced_block_after(["marker", "```python", "x = 1"], 0))

    def test_first_difference(self) -> None:
        self.assertEqual(first_difference(["a", "b"], ["a", "c"]),
                         "line 2 of the block: source has 'b', book has 'c'")
        self.assertEqual(first_difference(["a"], ["a", "b"]), "source has 1 lines, book has 2")


class CheckFile(unittest.TestCase):
    def check(self, chapter: str, source: str = SOURCE) -> list[str]:
        book = TempBook(chapter, source)

        try:
            return check_file(book.chapter, book.root)
        finally:
            book.close()

    def test_matching_block(self) -> None:
        self.assertEqual(self.check(chapter_with('def greet() -> str:\n    return "hi"\n')), [])

    def test_drifted_block(self) -> None:
        problems = self.check(chapter_with('def greet() -> str:\n    return "hello"\n'))

        self.assertEqual(len(problems), 1)
        self.assertIn("chapters/01-demo.md:3: block differs", problems[0])

    def test_missing_source(self) -> None:
        problems = self.check(chapter_with("x\n", "<!-- listing: lab/listings/python/gone.py#greet -->"))

        self.assertIn("listing source not found", problems[0])

    def test_missing_region(self) -> None:
        problems = self.check(chapter_with("x\n", "<!-- listing: lab/listings/python/demo.py#wave -->"))

        self.assertIn("region 'wave' not found", problems[0])

    def test_marker_without_block(self) -> None:
        problems = self.check(f"# Demo\n\n{MARKER}\n\nJust prose.\n")

        self.assertIn("no fenced code block follows", problems[0])

    def test_whole_file_marker(self) -> None:
        chapter = chapter_with(SOURCE, "<!-- listing: lab/listings/python/demo.py -->")

        self.assertEqual(self.check(chapter), [])


class UnmarkedAndMain(unittest.TestCase):
    def test_unmarked_python_blocks(self) -> None:
        chapter = chapter_with('def greet() -> str:\n    return "hi"\n') + "\n```python\nprint(1)\n```\n\n```text\nx\n```\n"
        book = TempBook(chapter)

        try:
            self.assertEqual(unmarked_python_blocks(book.chapter, book.root), ["chapters/01-demo.md:10"])
        finally:
            book.close()

    def test_unmarked_block_at_top_of_file(self) -> None:
        book = TempBook("```python\nprint(1)\n```\n")

        try:
            self.assertEqual(unmarked_python_blocks(book.chapter, book.root), ["chapters/01-demo.md:1"])
        finally:
            book.close()

    def run_main(self, chapter: str, *extra: str) -> tuple[int, str]:
        book = TempBook(chapter)
        output = io.StringIO()

        try:
            with contextlib.redirect_stdout(output):
                code = main(["--book-root", str(book.root), *extra])
        finally:
            book.close()

        return code, output.getvalue()

    def test_main_passes(self) -> None:
        code, output = self.run_main(chapter_with('def greet() -> str:\n    return "hi"\n'))

        self.assertEqual(code, 0)
        self.assertIn("check_listings: 1 marker(s), 0 problem(s)", output)

    def test_main_fails_and_lists_unmarked(self) -> None:
        chapter = chapter_with("drift\n") + "\n```python\nprint(1)\n```\n"
        code, output = self.run_main(chapter, "--list-unmarked")

        self.assertEqual(code, 1)
        self.assertIn("block differs", output)
        self.assertIn("unmarked python block: chapters/01-demo.md:9", output)


if __name__ == "__main__":
    unittest.main()
