"""Shared helpers for the listing tests: import path, manuscript examples, and region text.

Tests read the book's printed examples (packs, summaries) straight from the manuscript, so a test
fails when the book's text and the listing it describes disagree.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

LISTINGS = Path(__file__).resolve().parents[1]
BOOK_ROOT = LISTINGS.parents[2]

if str(LISTINGS) not in sys.path:
    sys.path.insert(0, str(LISTINGS))

CITATION = re.compile(r"\s*\[([^\]]+)\]")
SENTENCE_BREAK = re.compile(r"(?<=[.])\s+(?=[A-Z])")


def manuscript(relative: str) -> str:
    """Text of a manuscript file, relative to docs/book."""
    return (BOOK_ROOT / relative).read_text(encoding="utf-8")


def json_block_starting(relative: str, first_key: str) -> dict:
    """The first fenced JSON block in a manuscript file whose first key is first_key."""
    pattern = re.compile(r"```json\n(\{\n\s*\"" + re.escape(first_key) + r"\".*?)\n```", re.S)
    found = pattern.search(manuscript(relative))

    if found is None:
        raise LookupError(f"no JSON block starting with {first_key!r} in {relative}")

    return json.loads(found.group(1))


def quote_after(relative: str, label: str) -> str:
    """The first blockquote line after the line containing label."""
    text = manuscript(relative)
    start = text.index(label)
    found = re.compile(r"^> (.+)$", re.M).search(text, start)

    if found is None:
        raise LookupError(f"no blockquote after {label!r} in {relative}")

    return found.group(1)


def draft_from_quote(quote: str) -> dict:
    """Turn a printed summary into the structured draft a model would return.

    Each sentence keeps its text without the bracketed citations; every bracket's IDs become cites.
    """
    sentences = []

    for piece in SENTENCE_BREAK.split(quote.strip()):
        cites = [cite.strip() for group in CITATION.findall(piece) for cite in group.split(",")]
        text = CITATION.sub("", piece).strip()
        sentences.append({"text": text, "cites": cites})

    return {"status": "answered", "sentences": sentences}


def region_text(module_file: str, region: str) -> str:
    """The lines between '# region <region>' and '# endregion <region>' in a listing module."""
    lines = (LISTINGS / module_file).read_text(encoding="utf-8").splitlines()
    stripped = [line.strip() for line in lines]
    first = stripped.index(f"# region {region}")
    last = stripped.index(f"# endregion {region}", first)

    return "\n".join(lines[first + 1:last]) + "\n"
