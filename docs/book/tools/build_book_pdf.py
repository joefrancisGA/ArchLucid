#!/usr/bin/env python3
"""Build the draft PDF of *Managing Azure Security with AI* from the Markdown in ``docs/book``.

Usage (from the repository root):

    python docs/book/tools/build_book_pdf.py [--book-root docs/book]
        [--out docs/book/Managing-Azure-Security-with-AI-draft.pdf]
        [--include-unfinished] [--allow-long-lines]

Dependencies, tested with Python 3.14, ``markdown`` 3.11, and ``reportlab`` 5.0.1:

    pip install markdown reportlab

The tests in ``test_build_book_pdf.py`` also use ``pypdf`` (tested with 6.20.0) and skip the PDF checks
when ``reportlab`` or ``pypdf`` is missing.

Reading order: preface, chapters, appendices, glossary. Files that still contain ``[[OWNER: ...]]``
placeholders are left out unless ``--include-unfinished`` is passed, and the cover names them. The
build refuses to run (exit 1) while any fenced code line in a rendered file is longer than 100
characters, so authors fix the source instead of relying on wrapping; ``--allow-long-lines`` overrides.
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

from bookpdf.builder import build_pdf
from bookpdf.sources import LONG_LINE_LIMIT, book_files, long_code_lines, read_readme_field

BOOK_ROOT = Path(__file__).resolve().parents[1]
PDF_NAME = "Managing-Azure-Security-with-AI-draft.pdf"
DEFAULT_TITLE = "Managing Azure Security with AI"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the book's draft PDF.")
    parser.add_argument("--book-root", type=Path, default=BOOK_ROOT, help="Folder holding README.md and the book files.")
    parser.add_argument("--out", type=Path, default=None, help=f"Output PDF (default: <book-root>/{PDF_NAME}).")
    parser.add_argument("--include-unfinished", action="store_true", help="Render files with [[OWNER placeholders.")
    parser.add_argument("--allow-long-lines", action="store_true", help="Build even if code lines exceed the limit.")

    return parser.parse_args(argv)


def report_long_lines(files: list[Path], book_root: Path) -> int:
    """Print every over-long fenced code line and return how many there are."""
    total = 0

    for path in files:
        for number, length in long_code_lines(path.read_text(encoding="utf-8")):
            print(f"  {path.relative_to(book_root).as_posix()}:{number}: {length} characters")
            total += 1

    return total


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    book_root = args.book_root.resolve()
    out = (args.out or book_root / PDF_NAME).resolve()
    files, excluded = book_files(book_root, args.include_unfinished)

    for path in excluded:
        print(f"Excluded (unfinished): {path.relative_to(book_root).as_posix()}")

    print(f"Code lines over {LONG_LINE_LIMIT} characters:")
    long_count = report_long_lines(files, book_root)
    print(f"  {long_count} found")

    if long_count and not args.allow_long_lines:
        print("Fix the lines above, or pass --allow-long-lines to build anyway.")
        return 1

    readme = (book_root / "README.md").read_text(encoding="utf-8") if (book_root / "README.md").is_file() else ""
    title = read_readme_field(readme, "Working title") or DEFAULT_TITLE
    subtitle = read_readme_field(readme, "Working subtitle")
    pages = build_pdf(files, excluded, out, title, subtitle, date.today())
    print(f"Wrote {out} ({pages} pages)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
