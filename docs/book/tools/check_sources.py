#!/usr/bin/env python3
"""Fail when a book chapter's source citations and its Sources section disagree.

Text cites a source inline as ``[S1]`` or ``[S1, S3]``. Each file that cites anything has a
``## Sources`` section whose entries look like:

    - **[S1]** Title. Publisher. <https://example.com/page> Checked 2026-10-12. Version: v1. Kind: documented.

Problems (exit 1): a citation with no entry in the same file, an entry never cited, a duplicate entry,
or an entry without a URL, a ``Checked YYYY-MM-DD`` date, or a ``Kind:`` of documented, lab-tested, or
inference. Warnings (exit 0): an ``As of`` note with no citation in the same paragraph. Text inside
fenced code blocks is ignored, so listings and evidence-pack examples can't cite or be cited.

Usage: python docs/book/tools/check_sources.py [--book-root docs/book]
Standard library only.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

BOOK_ROOT = Path(__file__).resolve().parents[1]
MANUSCRIPT_DIRS = ("front-matter", "chapters", "appendices", "back-matter")
CITATION = re.compile(r"\[(S\d+(?:,\s*S\d+)*)\]")
ENTRY = re.compile(r"^\s*[-*]\s+\*\*\[S(?P<number>\d+)\]\*\*\s+(?P<text>.*)$")
SOURCES_HEADING = re.compile(r"^##\s+Sources\s*$")
HEADING = re.compile(r"^#{1,2}\s")
FENCE = re.compile(r"^\s*```")
URL = re.compile(r"https?://\S+")
CHECKED = re.compile(r"\bChecked \d{4}-\d{2}-\d{2}\b")
KIND = re.compile(r"\bKind: (documented|lab-tested|inference)\b")
AS_OF = re.compile(r"\*\*As of \d{4}-\d{2}")


@dataclass
class FileReport:
    """What one manuscript file cites, defines, and gets wrong."""

    cited: set[int] = field(default_factory=set)
    defined: set[int] = field(default_factory=set)
    problems: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def prose_lines(lines: list[str]) -> list[tuple[int, str]]:
    """(1-based line number, text) for every line outside fenced code blocks."""
    kept: list[tuple[int, str]] = []
    inside = False

    for number, line in enumerate(lines, start=1):
        if FENCE.match(line):
            inside = not inside
            continue

        if not inside:
            kept.append((number, line))

    return kept


def split_sources(lines: list[tuple[int, str]]) -> tuple[list[tuple[int, str]], list[tuple[int, str]]]:
    """(body lines, Sources-section lines); the section runs to the next level-1 or level-2 heading."""
    body: list[tuple[int, str]] = []
    sources: list[tuple[int, str]] = []
    in_sources = False

    for number, line in lines:
        if SOURCES_HEADING.match(line):
            in_sources = True
            continue

        if HEADING.match(line):
            in_sources = False

        (sources if in_sources else body).append((number, line))

    return body, sources


def cited_numbers(text: str) -> list[int]:
    """Every source number cited in ``text``, in order, with repeats."""
    return [int(item.strip()[1:]) for match in CITATION.finditer(text) for item in match.group(1).split(",")]


def entry_problems(where: str, number: int, text: str) -> list[str]:
    """Missing required fields in one Sources entry."""
    missing = [name for name, pattern in (("a URL", URL), ("'Checked YYYY-MM-DD'", CHECKED),
                                          ("'Kind: documented|lab-tested|inference'", KIND))
               if not pattern.search(text)]

    return [f"{where}: [S{number}] lacks {name}" for name in missing]


def paragraphs(lines: list[tuple[int, str]]) -> list[tuple[int, str]]:
    """(first line number, joined text) for each run of non-blank lines."""
    found: list[tuple[int, str]] = []
    current: list[tuple[int, str]] = []

    for number, line in lines + [(0, "")]:
        if line.strip():
            current.append((number, line))
            continue

        if current:
            found.append((current[0][0], " ".join(text for _, text in current)))
            current = []

    return found


def check_text(relative: str, text: str) -> FileReport:
    """Citation problems and warnings for one file's text."""
    report = FileReport()
    body, sources = split_sources(prose_lines(text.splitlines()))

    for number, line in body:
        report.cited.update(cited_numbers(line))

    for number, line in sources:
        entry = ENTRY.match(line)

        if not entry:
            continue

        where = f"{relative}:{number}"
        source = int(entry.group("number"))

        if source in report.defined:
            report.problems.append(f"{where}: [S{source}] is defined twice")

        report.defined.add(source)
        report.problems.extend(entry_problems(where, source, entry.group("text")))

    report.problems.extend(f"{relative}: [S{source}] is cited but has no Sources entry"
                           for source in sorted(report.cited - report.defined))
    report.problems.extend(f"{relative}: [S{source}] is in Sources but never cited"
                           for source in sorted(report.defined - report.cited))
    report.warnings.extend(f"{relative}:{number}: 'As of' note with no source citation"
                           for number, paragraph in paragraphs(body)
                           if AS_OF.search(paragraph) and not CITATION.search(paragraph))

    return report


def manuscript_files(book_root: Path) -> list[Path]:
    return sorted(path for folder in MANUSCRIPT_DIRS for path in (book_root / folder).glob("*.md"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check inline source citations against Sources sections.")
    parser.add_argument("--book-root", type=Path, default=BOOK_ROOT)
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    book_root = args.book_root.resolve()
    reports = [check_text(path.relative_to(book_root).as_posix(), path.read_text(encoding="utf-8"))
               for path in manuscript_files(book_root)]
    problems = [problem for report in reports for problem in report.problems]
    warnings = [warning for report in reports for warning in report.warnings]

    for problem in problems:
        print(problem)

    for warning in warnings:
        print(f"warning: {warning}")

    entries = sum(len(report.defined) for report in reports)
    print(f"check_sources: {entries} source(s), {len(problems)} problem(s), {len(warnings)} warning(s)")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
