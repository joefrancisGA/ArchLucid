#!/usr/bin/env python3
"""Fail when TECH_BACKLOG 'Next recommended batch' references tasks already marked Done."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_BACKLOG_REL = Path("docs/library/TECH_BACKLOG.md")
_NEXT_BATCH_RE = re.compile(
    r"\*\*Next recommended batch:\*\*\s*(.+?)(?:\.\s*Index:|$)",
    re.IGNORECASE | re.DOTALL,
)
_TB_ID_RE = re.compile(r"TB-(\d+)", re.IGNORECASE)
_TABLE_ROW_RE = re.compile(r"^\|\s*(~~)?TB-(\d+)(~~)?\s*\|", re.IGNORECASE)
_DONE_MARKERS: tuple[str, ...] = (
    "**done",
    "done (",
    "done —",
    "done**",
    "deferred (v1.1)",
    "deferred:",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def expand_tb_range(start: int, end: int) -> list[int]:
    if start > end:
        start, end = end, start

    return list(range(start, end + 1))


def parse_referenced_tb_ids(next_batch_text: str) -> list[int]:
    ids: list[int] = []

    for match in re.finditer(r"TB-(\d+)\s*[–-]\s*(\d+)", next_batch_text, re.IGNORECASE):
        ids.extend(expand_tb_range(int(match.group(1)), int(match.group(2))))

    for match in _TB_ID_RE.finditer(next_batch_text):
        value = int(match.group(1))

        if value not in ids:
            ids.append(value)

    return sorted(set(ids))


def parse_summary_table_status(text: str) -> dict[int, str]:
    statuses: dict[int, str] = {}

    for line in text.splitlines():
        match = _TABLE_ROW_RE.match(line)

        if match is None:
            continue

        tb_id = int(match.group(2))
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]

        if len(cells) < 3:
            continue

        status_cell = cells[2].lower()
        statuses[tb_id] = status_cell

    return statuses


def is_marked_done(tb_id: int, status_cell: str | None, *, strikethrough: bool) -> bool:
    if strikethrough:
        return True

    if status_cell is None:
        return False

    lowered = status_cell.lower()

    if "deferred" in lowered:
        return True

    return any(marker in lowered for marker in _DONE_MARKERS)


def next_batch_violations(root: Path) -> list[str]:
    path = root / _BACKLOG_REL

    if not path.is_file():
        return [f"{_BACKLOG_REL.as_posix()}: missing backlog file"]

    text = path.read_text(encoding="utf-8", errors="replace")
    match = _NEXT_BATCH_RE.search(text)

    if match is None:
        return [f"{_BACKLOG_REL.as_posix()}: missing 'Next recommended batch' line"]

    next_batch_text = match.group(1).strip()
    referenced_ids = parse_referenced_tb_ids(next_batch_text)
    statuses = parse_summary_table_status(text)
    violations: list[str] = []

    for tb_id in referenced_ids:
        status_cell = statuses.get(tb_id)
        strikethrough = f"~~TB-{tb_id}~~" in text or f"| ~~TB-{tb_id}~~ |" in text

        if is_marked_done(tb_id, status_cell, strikethrough=strikethrough):
            detail = status_cell or "(strikethrough or narrative Done)"

            violations.append(
                f"{_BACKLOG_REL.as_posix()}: Next recommended batch references TB-{tb_id} "
                f"but summary table marks it done/deferred: {detail}"
            )

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found.",
    )
    args = parser.parse_args(argv)

    violations = next_batch_violations(repo_root())

    if violations:
        for violation in violations:
            print(violation, file=sys.stderr)

        if args.advisory:
            print(f"tech backlog next-batch: {len(violations)} advisory finding(s).", file=sys.stderr)
            return 0

        return 1

    print("tech backlog next-batch: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
