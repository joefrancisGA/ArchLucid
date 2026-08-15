#!/usr/bin/env python3
"""Refresh or check the open-by-architectural-quality counts table in TECH_BACKLOG.md.

Counts unique open summary-table rows (deduped by TB id; first occurrence wins).
Done / rejected / strikethrough rows are excluded.

Usage:
  python scripts/ci/refresh_tech_backlog_category_counts.py --write
  python scripts/ci/refresh_tech_backlog_category_counts.py --check
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

_BACKLOG_REL = Path("docs/library/TECH_BACKLOG.md")

_START_MARKER = "<!-- tech-backlog-open-by-category:start -->"
_END_MARKER = "<!-- tech-backlog-open-by-category:end -->"

# Display order for the running open-count table (canonical architectural qualities).
_CANONICAL_CATEGORIES: tuple[str, ...] = (
    "Correctness",
    "Testability",
    "Reliability",
    "Deployability",
    "AI/Agent readiness",
    "Architectural integrity",
    "Adoption friction",
    "Commercial / marketability",
    "Data consistency",
    "Cutting-edge AI",
    "Explainability",
    "Proof-of-ROI / sponsor value",
    "Trustworthiness",
    "Maintainability",
    "Traceability",
    "Interoperability",
    "Compliance readiness",
    "Performance",
    "Scalability",
    "Cost-effectiveness",
    "Supportability",
    "Code hygiene",
    "Stickiness",
    "Accessibility",
    "Differentiability",
    "Operability",
    "Release gate",
)

_CATEGORY_ALIASES: dict[str, str] = {
    "Commercial": "Commercial / marketability",
    "Marketability": "Commercial / marketability",
    "Commercial / marketability": "Commercial / marketability",
    "Proof-of-ROI": "Proof-of-ROI / sponsor value",
    "Proof-of-ROI / sponsor value": "Proof-of-ROI / sponsor value",
    "Cost safety": "Cost-effectiveness",
    "Cost-effectiveness": "Cost-effectiveness",
    "Abuse prevention": "Trustworthiness",
}

_CLOSED_TITLE_RE = re.compile(
    r"(?i)\bDone\b|\bClosed\b|\bRejected\b|\bWaived\b|\bDeferred\b",
)
_CATEGORY_BEFORE_PRIORITY_RE = re.compile(r"^([A-Za-z0-9 /\-]+?)\s+P[0-3]\b")
_PRIORITY_RE = re.compile(r"\bP([0-3])\b")
_TB_ROW_RE = re.compile(r"^\|\s*TB-(\d+)\s*\|", re.IGNORECASE)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def normalize_category(raw: str) -> str:
    text = raw.strip()

    if text in _CATEGORY_ALIASES:
        return _CATEGORY_ALIASES[text]

    # "Trustworthiness / adoption" → Trustworthiness when left side is canonical.
    if " / " in text:
        left = text.split(" / ", 1)[0].strip()

        if left in _CATEGORY_ALIASES:
            return _CATEGORY_ALIASES[left]

        if left in _CANONICAL_CATEGORIES:
            return left

    return text


def is_open_summary_row(title_cell: str, driver_cell: str) -> bool:
    if "~~" in title_cell:
        return False

    if _CLOSED_TITLE_RE.search(title_cell):
        return False

    if _CLOSED_TITLE_RE.search(driver_cell) and re.search(
        r"(?i)\bDone\b|\bClosed\b|\bRejected\b|\bWaived\b",
        driver_cell,
    ):
        # Driver cells often say "pairs Done TB-xxx" — only treat as closed when
        # the whole priority cell is a closed status, not a cross-ref.
        if re.search(r"(?i)^\s*(\*\*)?(Done|Closed|Rejected|Waived)\b", driver_cell):
            return False

    return True


def iter_summary_table_lines(text: str) -> list[str]:
    """Return lines from the first summary header through the line before ## TB-."""
    lines = text.splitlines()
    started = False
    collected: list[str] = []

    for line in lines:
        if line.startswith("| ID | Title | Priority driver"):
            started = True
            collected.append(line)
            continue

        if started and line.startswith("## TB-"):
            break

        if started:
            collected.append(line)

    return collected


def count_open_by_category(text: str) -> tuple[Counter[str], Counter[str], int]:
    """Return (category_counts, priority_counts, open_total) for unique open TB rows."""
    category_counts: Counter[str] = Counter()
    priority_counts: Counter[str] = Counter()
    seen_ids: set[int] = set()
    open_total = 0

    for line in iter_summary_table_lines(text):
        match = _TB_ROW_RE.match(line)

        if match is None:
            continue

        tb_id = int(match.group(1))

        if tb_id in seen_ids:
            continue

        seen_ids.add(tb_id)
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]

        if len(cells) < 3:
            continue

        title = cells[1]
        driver = cells[2]

        if not is_open_summary_row(title, driver):
            continue

        open_total += 1
        priority_match = _PRIORITY_RE.search(driver)

        if priority_match is not None:
            priority_counts[f"P{priority_match.group(1)}"] += 1
        else:
            priority_counts["unlabeled"] += 1

        category_match = _CATEGORY_BEFORE_PRIORITY_RE.match(driver)

        if category_match is None:
            category_counts["Other / uncategorized"] += 1
            continue

        category_counts[normalize_category(category_match.group(1))] += 1

    return category_counts, priority_counts, open_total


def render_counts_block(
    category_counts: Counter[str],
    priority_counts: Counter[str],
    open_total: int,
    *,
    as_of: date | None = None,
) -> str:
    when = (as_of or date.today()).isoformat()
    lines: list[str] = [
        _START_MARKER,
        "",
        f"**Open counts by architectural quality** (auto-maintained; last refreshed **{when}**).",
        "",
        "Regenerate after opening or closing summary-table rows:",
        "`python scripts/ci/refresh_tech_backlog_category_counts.py --write`",
        "",
        "| Architectural quality | Open |",
        "| --- | ---: |",
    ]

    ordered = list(_CANONICAL_CATEGORIES)
    extras = sorted(
        cat
        for cat in category_counts
        if cat not in _CANONICAL_CATEGORIES and cat != "Other / uncategorized"
    )
    ordered.extend(extras)

    if category_counts.get("Other / uncategorized", 0) > 0:
        ordered.append("Other / uncategorized")

    for category in ordered:
        count = int(category_counts.get(category, 0))

        # Only list categories that currently have open work.
        if count == 0:
            continue

        lines.append(f"| {category} | {count} |")

    category_sum = sum(category_counts.values())
    lines.append(f"| **Total (unique open)** | **{open_total}** |")
    lines.append("")

    if category_sum != open_total:
        lines.append(
            f"> Note: category column sum is **{category_sum}** "
            f"(should match total; investigate parser drift if not)."
        )
        lines.append("")

    p0 = priority_counts.get("P0", 0)
    p1 = priority_counts.get("P1", 0)
    p2 = priority_counts.get("P2", 0)
    p3 = priority_counts.get("P3", 0)
    unlabeled = priority_counts.get("unlabeled", 0)
    lines.append(
        f"**By priority band:** P0 **{p0}** | P1 **{p1}** | P2 **{p2}** | P3 **{p3}**"
        + (f" | unlabeled **{unlabeled}**" if unlabeled else "")
        + "."
    )
    lines.append("")
    lines.append(_END_MARKER)

    return "\n".join(lines)


def extract_counts_block(text: str) -> str | None:
    start = text.find(_START_MARKER)
    end = text.find(_END_MARKER)

    if start < 0 or end < 0 or end < start:
        return None

    return text[start : end + len(_END_MARKER)]


def replace_or_insert_counts_block(text: str, block: str) -> str:
    existing = extract_counts_block(text)

    if existing is not None:
        return text.replace(existing, block, 1)

    # Legacy table: replace from the section heading through the Total row.
    legacy_heading = "## Cursor-actionable backlog"
    heading_idx = text.find(legacy_heading)

    if heading_idx < 0:
        raise ValueError(
            "Could not find open-by-category markers or "
            "'## Cursor-actionable backlog' heading in TECH_BACKLOG.md"
        )

    # Find end of legacy table (line with **Total**) then optional blank lines.
    after_heading = text[heading_idx:]
    total_match = re.search(
        r"^\| \*\*Total[^\n]*\n",
        after_heading,
        re.MULTILINE,
    )

    if total_match is None:
        raise ValueError("Could not find legacy '| **Total' row to replace")

    # Include everything from heading line start through the Total row.
    # Keep the following narrative (**BDA register:** …) intact.
    replace_end_local = total_match.end()
    # Skip one trailing newline after the Total row if present (already consumed).
    prefix = text[:heading_idx]
    suffix = text[heading_idx + replace_end_local :]

    # Drop the old heading + Updated + table; insert new heading + block.
    new_heading = (
        "## Cursor-actionable backlog - open by architectural quality\n\n"
        f"{block}\n\n"
    )

    return prefix + new_heading + suffix.lstrip("\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--write",
        action="store_true",
        help="Rewrite the open-by-category counts block in TECH_BACKLOG.md",
    )
    mode.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 when the committed counts block is stale",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Repo root (defaults to repository containing this script)",
    )
    args = parser.parse_args(argv)

    root = args.root if args.root is not None else repo_root()
    path = root / _BACKLOG_REL

    if not path.is_file():
        print(f"Missing {_BACKLOG_REL.as_posix()}", file=sys.stderr)
        return 2

    text = path.read_text(encoding="utf-8")
    category_counts, priority_counts, open_total = count_open_by_category(text)
    block = render_counts_block(category_counts, priority_counts, open_total)

    if args.check:
        existing = extract_counts_block(text)

        if existing is None:
            print(
                "TECH_BACKLOG.md is missing the open-by-category marker block. "
                "Run: python scripts/ci/refresh_tech_backlog_category_counts.py --write",
                file=sys.stderr,
            )
            return 1

        # Compare without the date line so same-day vs next-day does not flake;
        # instead compare category rows + totals + priority band.
        def _stable(body: str) -> str:
            lines = []

            for line in body.splitlines():
                if line.startswith("**Open counts by architectural quality**"):
                    continue

                lines.append(line)

            return "\n".join(lines)

        expected_stable = _stable(block)
        existing_stable = _stable(existing)

        if existing_stable != expected_stable:
            print(
                "TECH_BACKLOG open-by-category counts are stale. "
                "Run: python scripts/ci/refresh_tech_backlog_category_counts.py --write",
                file=sys.stderr,
            )
            print(
                f"Expected open total={open_total}; "
                f"priority bands={dict(priority_counts)}",
                file=sys.stderr,
            )
            return 1

        print(
            f"OK: open-by-category counts current "
            f"(open={open_total}, categories={len(category_counts)})"
        )
        return 0

    updated = replace_or_insert_counts_block(text, block)

    if updated == text:
        print("No changes (counts already current).")
        return 0

    path.write_text(updated, encoding="utf-8", newline="\n")
    print(
        f"Wrote open-by-category counts: open={open_total} "
        f"categories={len(category_counts)} priorities={dict(priority_counts)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
