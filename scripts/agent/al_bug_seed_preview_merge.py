#!/usr/bin/env python3
"""Merge paste-ready seeder previews with cross-source dedup (ABQ-43)."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from enum import IntEnum
from pathlib import Path

MERGE_CAP = 15
PATH_LINE = re.compile(r"\bat\s+([^:\s]+):(\d+)\b")
CANDIDATE_LINE = re.compile(r"^\s*-\s+\[\s*\]\s+(.+)$")


class SourcePriority(IntEnum):
    MUTANT = 0
    ANALYZER = 1
    FLAKE = 2
    OTHER = 3


@dataclass(frozen=True)
class CandidateRow:
    line: str
    source: SourcePriority
    dedup_key: str


def classify_source(line: str) -> SourcePriority:
    lowered = line.lower()
    if lowered.startswith("(candidate) mutant"):
        return SourcePriority.MUTANT
    if lowered.startswith("(candidate) analyzer"):
        return SourcePriority.ANALYZER
    if lowered.startswith("(candidate) flake"):
        return SourcePriority.FLAKE
    return SourcePriority.OTHER


def dedup_key_for_line(line: str) -> str:
    match = PATH_LINE.search(line)
    if match:
        return f"{match.group(1)}:{match.group(2)}"
    return line.strip()


def parse_candidate_lines(text: str) -> list[CandidateRow]:
    rows: list[CandidateRow] = []
    for raw in text.splitlines():
        match = CANDIDATE_LINE.match(raw)
        if match:
            body = match.group(1).strip()
        elif raw.strip().startswith("(candidate)"):
            body = raw.strip()
        else:
            continue
        rows.append(
            CandidateRow(
                line=body,
                source=classify_source(body),
                dedup_key=dedup_key_for_line(body),
            )
        )
    return rows


def merge_candidates(chunks: list[list[CandidateRow]], cap: int = MERGE_CAP) -> list[str]:
    seen: set[str] = set()
    merged: list[CandidateRow] = []
    for chunk in sorted(chunks, key=lambda rows: min((row.source for row in rows), default=SourcePriority.OTHER)):
        for row in sorted(chunk, key=lambda item: (item.source, item.dedup_key)):
            if row.dedup_key in seen:
                continue
            seen.add(row.dedup_key)
            merged.append(row)
    merged.sort(key=lambda item: (item.source, item.dedup_key))
    return [row.line for row in merged[:cap]]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="*", type=Path, help="Markdown preview files to merge.")
    parser.add_argument("--stdin", action="store_true", help="Also read candidate markdown from stdin.")
    parser.add_argument("--cap", type=int, default=MERGE_CAP)
    args = parser.parse_args(argv)

    chunks: list[list[CandidateRow]] = []
    for path in args.inputs:
        if path.is_file():
            chunks.append(parse_candidate_lines(path.read_text(encoding="utf-8")))
    if args.stdin:
        chunks.append(parse_candidate_lines(sys.stdin.read()))

    lines = merge_candidates(chunks, cap=args.cap)
    for line in lines:
        print(f"- [ ] {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
