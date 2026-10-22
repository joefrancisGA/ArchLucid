#!/usr/bin/env python3
"""Fail when the book refers to a chapter, section, lab step, or appendix that doesn't exist.

Targets come from the manuscript itself:

- chapters from ``chapters/NN-*.md`` file names, and their sections from ``## N.M`` headings,
- lab steps from ``**Step N`` paragraphs (``**Step 4a`` too) in each chapter,
- appendices from ``appendices/x-*.md`` file names, and their sections from ``## X.N`` headings.

References checked, outside fenced code: ``Chapter 4``, ``Chapters 7 and 8``, ``section 4.3``,
``sections 11.3-11.6``, ``Chapter 4, section 5.3`` (section in the wrong chapter), ``Chapter 4, Step 3``,
``Chapter 5 Step 5's``, ``Chapter 4's optional Step 3a``, ``Appendix B``, and ``B.6``.

Usage: python docs/book/tools/check_cross_refs.py [--book-root docs/book]
Standard library only.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from check_sources import manuscript_files, prose_lines

BOOK_ROOT = Path(__file__).resolve().parents[1]

# A list or range joiner: "7 and 8", "3, 4, and 5", "3 to 10", "11.3-11.6", "5.4–5.6".
JOIN = r"(?:,\s+and\s+|,\s+or\s+|,\s+|\s+and\s+|\s+or\s+|\s+to\s+|\s*[-–]\s*)"
CHAPTER_REF = re.compile(rf"\bChapters?\s+(\d+(?:{JOIN}\d+)*)\b")
SECTION_REF = re.compile(rf"\b(?:Chapter\s+(?P<chapter>\d+),\s+)?[Ss]ections?\s+(?P<list>\d+\.\d+(?:{JOIN}\d+\.\d+)*)")
STEP_REF = re.compile(r"\bChapter\s+(?P<chapter>\d+)(?:'s|,)?\s+(?:optional\s+)?(?:lab\s+)?Steps?\s+(?P<step>\d+[a-z]?)\b")
APPENDIX_REF = re.compile(r"\bAppendix\s+([A-Z])\b")
APPENDIX_SECTION_REF = re.compile(r"(?<![\w.])([A-H])\.(\d+)(?![\w.]*\d)")

CHAPTER_HEADING = re.compile(r"^#{2,4}\s+(\d+\.\d+)\b")
APPENDIX_HEADING = re.compile(r"^#{2,4}\s+([A-H]\.\d+)\b")
STEP_HEADING = re.compile(r"^\*\*Step\s+(\d+[a-z]?)\b")


@dataclass
class Targets:
    """Everything a reference may point to."""

    chapters: set[int] = field(default_factory=set)
    sections: set[str] = field(default_factory=set)
    steps: dict[int, set[str]] = field(default_factory=dict)
    appendices: set[str] = field(default_factory=set)
    appendix_sections: set[str] = field(default_factory=set)


@dataclass
class FileReport:
    """How many references one file makes, and which ones don't resolve."""

    references: int = 0
    problems: list[str] = field(default_factory=list)


def chapter_targets(targets: Targets, number: int, text: str) -> None:
    """Add one chapter, its numbered sections, and its lab steps."""
    lines = [line for _, line in prose_lines(text.splitlines())]
    targets.chapters.add(number)
    targets.sections.update(match.group(1) for line in lines if (match := CHAPTER_HEADING.match(line)))
    targets.steps[number] = {match.group(1) for line in lines if (match := STEP_HEADING.match(line))}


def appendix_targets(targets: Targets, letter: str, text: str) -> None:
    """Add one appendix and its lettered sections."""
    lines = [line for _, line in prose_lines(text.splitlines())]
    targets.appendices.add(letter)
    targets.appendix_sections.update(match.group(1) for line in lines if (match := APPENDIX_HEADING.match(line)))


def collect_targets(book_root: Path) -> Targets:
    """Read every chapter and appendix under ``book_root``."""
    targets = Targets()

    for path in sorted((book_root / "chapters").glob("[0-9][0-9]-*.md")):
        chapter_targets(targets, int(path.name[:2]), path.read_text(encoding="utf-8"))

    for path in sorted((book_root / "appendices").glob("[a-z]-*.md")):
        appendix_targets(targets, path.name[0].upper(), path.read_text(encoding="utf-8"))

    return targets


def numbers_in(listing: str, pattern: str) -> list[str]:
    """Each number in a list or range such as ``7 and 8`` or ``11.3-11.6``."""
    return re.findall(pattern, listing)


def chapter_problems(line: str, targets: Targets) -> tuple[int, list[str]]:
    """(references found, problems) for ``Chapter N`` and ``Chapters N and M``."""
    found = [int(number) for match in CHAPTER_REF.finditer(line) for number in numbers_in(match.group(1), r"\d+")]

    return len(found), [f"no Chapter {number}" for number in found if number not in targets.chapters]


def section_problems(line: str, targets: Targets) -> tuple[int, list[str]]:
    """(references found, problems) for ``section N.M``, including a section named in the wrong chapter."""
    count = 0
    problems: list[str] = []

    for match in SECTION_REF.finditer(line):
        for section in numbers_in(match.group("list"), r"\d+\.\d+"):
            count += 1

            if section not in targets.sections:
                problems.append(f"no section {section}")
                continue

            chapter = match.group("chapter")

            # "Chapter 4, section 5.3" resolves, but to the wrong chapter.
            if chapter is not None and section.split(".")[0] != chapter:
                problems.append(f"section {section} isn't in Chapter {chapter}")

    return count, problems


def step_problems(line: str, targets: Targets) -> tuple[int, list[str]]:
    """(references found, problems) for ``Chapter N, Step M``."""
    count = 0
    problems: list[str] = []

    for match in STEP_REF.finditer(line):
        chapter, step = int(match.group("chapter")), match.group("step")
        count += 1

        # A missing chapter is already reported by chapter_problems.
        if chapter in targets.steps and step not in targets.steps[chapter]:
            problems.append(f"Chapter {chapter} has no Step {step}")

    return count, problems


def appendix_problems(line: str, targets: Targets) -> tuple[int, list[str]]:
    """(references found, problems) for ``Appendix X`` and ``X.N``."""
    appendices = [match.group(1) for match in APPENDIX_REF.finditer(line)]
    sections = [f"{match.group(1)}.{match.group(2)}" for match in APPENDIX_SECTION_REF.finditer(line)]
    problems = [f"no Appendix {letter}" for letter in appendices if letter not in targets.appendices]
    problems.extend(f"no appendix section {section}" for section in sections
                    if section not in targets.appendix_sections)

    return len(appendices) + len(sections), problems


CHECKS = (chapter_problems, section_problems, step_problems, appendix_problems)


def check_text(relative: str, text: str, targets: Targets) -> FileReport:
    """Unresolved references in one file's prose."""
    report = FileReport()

    for number, line in prose_lines(text.splitlines()):
        for check in CHECKS:
            count, problems = check(line, targets)
            report.references += count
            report.problems.extend(f"{relative}:{number}: {problem}" for problem in problems)

    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check chapter, section, step, and appendix references.")
    parser.add_argument("--book-root", type=Path, default=BOOK_ROOT)
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    book_root = args.book_root.resolve()
    targets = collect_targets(book_root)
    reports = [check_text(path.relative_to(book_root).as_posix(), path.read_text(encoding="utf-8"), targets)
               for path in manuscript_files(book_root)]
    problems = [problem for report in reports for problem in report.problems]

    for problem in problems:
        print(problem)

    references = sum(report.references for report in reports)
    print(f"check_cross_refs: {references} reference(s), {len(problems)} problem(s)")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
