#!/usr/bin/env python3
"""
Insert a standard spine signpost immediately after the first non-empty line in each
active ``docs/**/*.md`` file (skipping ``docs/archive/`` and the five spine files).

Run with ``--apply`` to write files; without it, prints a summary only.

Signpost marker: ``> **Spine doc:**`` — idempotent when re-run (skips if marker present).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

UTF8_BOM = "\ufeff"

SPINE_FILENAMES: frozenset[str] = frozenset(
    {
        "INSTALL_ORDER.md",
        "FIRST_30_MINUTES.md",
        "CORE_PILOT.md",
        "ARCHITECTURE_ON_ONE_PAGE.md",
        "PENDING_QUESTIONS.md",
        "FIRST_5_DOCS.md",
        # Canonical buyer narrative — owner-only edits; never auto-insert spine banners.
        "EXECUTIVE_SPONSOR_BRIEF.md",
    },
)

MARKER_RE = re.compile(r"^\s*>\s*\*\*Spine doc:\*\*", re.IGNORECASE)
SCOPE_RE = re.compile(r"^\s*>\s*\*\*Scope:\*\*", re.IGNORECASE)


def strip_leading_bom(text: str) -> str:
    if text.startswith(UTF8_BOM):
        return text[len(UTF8_BOM) :]

    return text


def first_non_empty_line_index(lines: list[str]) -> int | None:
    for i, line in enumerate(lines):
        if line.strip():
            return i

    return None


def relpath_to_first5(from_file: Path, docs_dir: Path) -> str:
    anchor = docs_dir / "FIRST_5_DOCS.md"
    return Path(os.path.relpath(anchor, start=from_file.parent)).as_posix()


def build_signpost(relative: str) -> str:
    return (
        f"> **Spine doc:** [Five-document onboarding spine]({relative}). "
        "Read this file only if you have a specific reason beyond those five entry documents."
    )


def process_file(path: Path, docs_dir: Path, apply: bool) -> str:
    raw = path.read_text(encoding="utf-8")
    text = strip_leading_bom(raw)
    lines = text.splitlines(keepends=True)

    if not lines:
        return "empty"

    idx = first_non_empty_line_index(lines)

    if idx is None:
        return "no-content"

    first = lines[idx]

    if not SCOPE_RE.match(first):
        return "no-scope"

    window = "".join(lines[idx : idx + 6])

    if MARKER_RE.search(window):
        return "skip-marked"

    rel = relpath_to_first5(path, docs_dir)
    signpost = build_signpost(rel)
    insert_lines = ["\n", signpost + "\n", "\n"]

    if apply:
        new_body = "".join(lines[: idx + 1] + insert_lines + lines[idx + 1 :])
        path.write_text(new_body, encoding="utf-8", newline="\n")

    return "inserted" if apply else "would-insert"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write files (default is dry-run counts only).",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="Repository root.",
    )
    args = parser.parse_args()
    root: Path = args.repo_root.resolve()
    docs_dir = root / "docs"

    if not docs_dir.is_dir():
        print("error: docs/ not found", file=sys.stderr)
        return 2

    counts: dict[str, int] = {}

    for path in sorted(docs_dir.rglob("*.md")):
        rel = path.relative_to(root)

        if "archive" in rel.parts:
            continue

        if path.name in SPINE_FILENAMES:
            continue

        outcome = process_file(path, docs_dir, apply=args.apply)
        counts[outcome] = counts.get(outcome, 0) + 1

    for key in sorted(counts):
        print(f"{key}: {counts[key]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
