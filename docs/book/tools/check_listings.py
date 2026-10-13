#!/usr/bin/env python3
"""Fail when a book listing has drifted from its tested source file.

A listing in the book is synced by an HTML comment directly above its fenced block:

    <!-- listing: lab/listings/python/ch05_paths.py#identity_graph -->

The path is relative to ``docs/book``. ``#name`` selects the lines between ``# region name`` and
``# endregion name`` in that file (``// region name`` in languages that comment with ``//``, such as
KQL); without ``#name`` the whole file is compared. A region is dedented first, so a fragment nested
inside a Terraform block can match an unindented listing. The fenced block must match the source
exactly, ignoring trailing whitespace and leading or trailing blank lines.

Usage: python docs/book/tools/check_listings.py [--book-root docs/book] [--list-unmarked]
Exit 0 when every marker matches, 1 otherwise. Standard library only.
"""

from __future__ import annotations

import argparse
import re
import sys
import textwrap
from pathlib import Path

BOOK_ROOT = Path(__file__).resolve().parents[1]
MANUSCRIPT_DIRS = ("front-matter", "chapters", "appendices", "back-matter")
MARKER = re.compile(r"^<!--\s*listing:\s*(?P<path>[^#\s]+)(?:#(?P<region>[\w-]+))?\s*-->\s*$")
FENCE_OPEN = re.compile(r"^```(?P<lang>\S*)\s*$")
FENCE_CLOSE = re.compile(r"^```\s*$")
COMMENT_PREFIXES = ("#", "//")


def normalized(lines: list[str]) -> list[str]:
    """Lines without trailing whitespace, and without leading or trailing blank lines."""
    stripped = [line.rstrip() for line in lines]

    while stripped and not stripped[0]:
        stripped.pop(0)

    while stripped and not stripped[-1]:
        stripped.pop()

    return stripped


def comment_text(line: str) -> str | None:
    """The text of a '#' or '//' comment line, or None for any other line."""
    stripped = line.strip()

    for prefix in COMMENT_PREFIXES:
        if stripped.startswith(prefix):
            return stripped[len(prefix):].strip()

    return None


def region_lines(source: list[str], region: str | None) -> list[str] | None:
    """The dedented lines of ``region`` in ``source``, the whole source when region is None, or None if absent."""
    if region is None:
        return source

    comments = [comment_text(line) for line in source]

    if f"region {region}" not in comments:
        return None

    first = comments.index(f"region {region}")

    if f"endregion {region}" not in comments[first:]:
        return None

    last = comments.index(f"endregion {region}", first)

    return textwrap.dedent("\n".join(source[first + 1:last])).split("\n")


def fenced_block_after(lines: list[str], index: int) -> tuple[int, list[str]] | None:
    """(line number of the opening fence, block lines) for the first fence after ``index``, skipping blanks."""
    cursor = index + 1

    while cursor < len(lines) and not lines[cursor].strip():
        cursor += 1

    if cursor >= len(lines) or not FENCE_OPEN.match(lines[cursor]):
        return None

    for end in range(cursor + 1, len(lines)):
        if FENCE_CLOSE.match(lines[end]):
            return cursor + 1, lines[cursor + 1:end]

    return None


def first_difference(expected: list[str], actual: list[str]) -> str:
    """Human-readable first mismatch between the source region and the book block."""
    for number, (want, got) in enumerate(zip(expected, actual), start=1):
        if want != got:
            return f"line {number} of the block: source has {want!r}, book has {got!r}"

    return f"source has {len(expected)} lines, book has {len(actual)}"


def check_file(path: Path, book_root: Path) -> list[str]:
    """Problems for every listing marker in one manuscript file."""
    lines = path.read_text(encoding="utf-8").splitlines()
    relative = path.relative_to(book_root).as_posix()
    problems: list[str] = []

    for index, line in enumerate(lines):
        marker = MARKER.match(line.strip())

        if not marker:
            continue

        where = f"{relative}:{index + 1}"
        source_path = book_root / marker.group("path")
        region = marker.group("region")

        if not source_path.is_file():
            problems.append(f"{where}: listing source not found: {marker.group('path')}")
            continue

        expected = region_lines(source_path.read_text(encoding="utf-8").splitlines(), region)

        if expected is None:
            problems.append(f"{where}: region '{region}' not found in {marker.group('path')}")
            continue

        block = fenced_block_after(lines, index)

        if block is None:
            problems.append(f"{where}: no fenced code block follows the listing marker")
            continue

        if normalized(expected) != normalized(block[1]):
            problems.append(f"{where}: block differs from {marker.group('path')}#{region}: "
                            f"{first_difference(normalized(expected), normalized(block[1]))}")

    return problems


def unmarked_python_blocks(path: Path, book_root: Path) -> list[str]:
    """``file:line`` for each python block with no listing marker above it."""
    lines = path.read_text(encoding="utf-8").splitlines()
    found: list[str] = []

    for index, line in enumerate(lines):
        opening = FENCE_OPEN.match(line)

        if not opening or opening.group("lang") != "python":
            continue

        previous = index - 1

        while previous >= 0 and not lines[previous].strip():
            previous -= 1

        if previous < 0 or not MARKER.match(lines[previous].strip()):
            found.append(f"{path.relative_to(book_root).as_posix()}:{index + 1}")

    return found


def manuscript_files(book_root: Path) -> list[Path]:
    return sorted(path for folder in MANUSCRIPT_DIRS for path in (book_root / folder).glob("*.md"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check book listings against their tested sources.")
    parser.add_argument("--book-root", type=Path, default=BOOK_ROOT)
    parser.add_argument("--list-unmarked", action="store_true", help="Also list python blocks with no marker.")
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    book_root = args.book_root.resolve()
    files = manuscript_files(book_root)
    problems = [problem for path in files for problem in check_file(path, book_root)]
    markers = sum(1 for path in files for line in path.read_text(encoding="utf-8").splitlines()
                  if MARKER.match(line.strip()))

    for problem in problems:
        print(problem)

    if args.list_unmarked:
        for location in (item for path in files for item in unmarked_python_blocks(path, book_root)):
            print(f"unmarked python block: {location}")

    print(f"check_listings: {markers} marker(s), {len(problems)} problem(s)")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
