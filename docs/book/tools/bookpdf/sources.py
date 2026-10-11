"""Reading order, Markdown clean-up, and source checks for the book's Markdown files."""

from __future__ import annotations

import re
from pathlib import Path

UNFINISHED_MARKER = "[[OWNER"
LONG_LINE_LIMIT = 100

_AUTHOR_NOTES = re.compile(r"^## Author notes \(remove before submission\)", re.MULTILINE)
_FENCE = re.compile(r"^\s*(?:```|~~~)(?P<lang>\S*)")
# A JSON line holding one string value (optionally keyed) can't be broken without changing the value.
_UNBREAKABLE_JSON = re.compile(r'^\s*(?:"(?:[^"\\]|\\.)*"\s*:\s*)?"(?:[^"\\]|\\.)*"\s*,?\s*$')
_STRIPPED_LINES = (
    re.compile(r"^> \*\*Scope:\*\*.*(?:\n|$)", re.MULTILINE),
    re.compile(r"^> \*\*Status:\*\*.*(?:\n|$)", re.MULTILINE),
    re.compile(r"^> \*Draft status:.*(?:\n|$)", re.MULTILINE),
    re.compile(r"^\*\*Spine:\*\*.*(?:\n|$)", re.MULTILINE),
)
_README_FIELD = r"^\*\*{label}:\*\*\s*\*?(?P<value>.+?)\*?\s*$"


def reading_order(book_root: Path) -> list[Path]:
    """Every book file in reading order, whether or not it is finished."""
    candidates = [
        book_root / "front-matter" / "preface.md",
        *sorted((book_root / "chapters").glob("[0-9][0-9]-*.md")),
        *sorted((book_root / "appendices").glob("[a-z]-*.md")),
        book_root / "back-matter" / "glossary.md",
    ]

    return [path for path in candidates if path.is_file()]


def is_unfinished(text: str) -> bool:
    """A file still waiting on owner input carries ``[[OWNER: ...]]`` placeholders."""
    return UNFINISHED_MARKER in text


def book_files(book_root: Path, include_unfinished: bool) -> tuple[list[Path], list[Path]]:
    """Return (files to render, unfinished files left out), both in reading order."""
    if book_root is None:
        raise ValueError("book_root is required")

    included: list[Path] = []
    excluded: list[Path] = []

    for path in reading_order(book_root):
        unfinished = is_unfinished(path.read_text(encoding="utf-8"))
        target = excluded if unfinished and not include_unfinished else included
        target.append(path)

    return included, excluded


def body_before_author_notes(text: str) -> str:
    """Everything above the ``## Author notes (remove before submission)`` heading."""
    return _AUTHOR_NOTES.split(text, maxsplit=1)[0]


def clean_markdown(text: str) -> str:
    """Drop working-draft furniture: scope, status, draft-status and spine lines, and author notes."""
    if text is None:
        return ""

    cleaned = body_before_author_notes(text)

    for pattern in _STRIPPED_LINES:
        cleaned = pattern.sub("", cleaned, count=1)

    return cleaned


def read_readme_field(readme_text: str, label: str) -> str | None:
    """Value of a ``**Label:** *value*`` line in the book README, without the italics."""
    if not readme_text:
        return None

    match = re.search(_README_FIELD.format(label=re.escape(label)), readme_text, re.MULTILINE)

    return match.group("value").strip() if match else None


def is_unbreakable(line: str, language: str) -> bool:
    """True for a JSON line that is one string value; the PDF wraps it, but the source can't be shortened."""
    return language == "json" and bool(_UNBREAKABLE_JSON.match(line))


def long_code_lines(text: str, limit: int = LONG_LINE_LIMIT) -> list[tuple[int, int]]:
    """(line number, length) of every fenced code line longer than ``limit``, above the author notes.

    Unbreakable JSON string values are not reported.
    """
    language: str | None = None
    found: list[tuple[int, int]] = []

    for number, line in enumerate(body_before_author_notes(text).splitlines(), start=1):
        fence = _FENCE.match(line)

        if fence:
            language = None if language is not None else fence.group("lang").lower()
            continue

        length = len(line.expandtabs(4))

        if language is not None and length > limit and not is_unbreakable(line, language):
            found.append((number, length))

    return found
