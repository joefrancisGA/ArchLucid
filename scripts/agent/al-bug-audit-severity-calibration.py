#!/usr/bin/env python3
"""Sample high-impact hunt rows for named 1.1b user-visible harm (ABQ-35).

Does not rewrite historical bugs-found. Does not add tokens to
al-bug-audit-proven-rows.py. Honest title: sample of high-impact rows.
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_ledger import (  # noqa: E402
    DEFAULT_LEDGER_PATH,
    ProvenRow,
    collect_proven_rows,
    parse_zone_impacts,
)

DEFAULT_REPORT = Path(__file__).resolve().parents[2] / "docs/library/AL_BUG_SEVERITY_CALIBRATION_AUDIT.md"
DATE_PATTERN = re.compile(r"\b(20\d{2}-\d{2}-\d{2})\b")
# Prefer zone impact; avoid matching "highlight".
HIGH_SEVERITY_WORD = re.compile(r"(?<![a-z])high(?![a-z])", re.IGNORECASE)


def extract_row_date(text: str) -> datetime | None:
    match = DATE_PATTERN.search(text)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def names_user_visible_harm(text: str) -> bool:
    lowered = text.lower()
    if "cross-tenant" in lowered and "200" in lowered:
        return True
    if any(token in lowered for token in ("secret", "password", "apikey", "api-key")) and any(
        surface in lowered for surface in ("summary", "export", "packet")
    ):
        return True
    if "committed" in lowered and "manifest" in lowered:
        return True
    if "200" in lowered and any(code in lowered for code in ("403", "404")):
        return True
    return False


def classify_row(text: str) -> str:
    if extract_row_date(text) is None:
        return "skipped"
    if names_user_visible_harm(text):
        return "harm-named"
    return "uncalibrated"


def select_high_impact_rows(
    rows: list[ProvenRow],
    impacts: dict[str, str],
    since: datetime | None,
    sample: int,
) -> list[ProvenRow]:
    selected: list[ProvenRow] = []
    for row in rows:
        zone_high = impacts.get(row.zone_id) == "high"
        line_high = HIGH_SEVERITY_WORD.search(row.text) is not None
        if not zone_high and not line_high:
            continue
        row_date = extract_row_date(row.text)
        if since is not None and row_date is not None and row_date < since:
            continue
        selected.append(row)
        if len(selected) >= sample:
            break
    return selected


def render_report(rows: list[ProvenRow], classifications: list[str]) -> str:
    counts = {"harm-named": 0, "uncalibrated": 0, "skipped": 0}
    for label in classifications:
        counts[label] = counts.get(label, 0) + 1
    named = counts["harm-named"]
    total = len(rows)
    pct = (100.0 * named / total) if total else 0.0
    lines = [
        "> **Scope:** Sample of high-impact `(proven)` rows — not a claim that all high bugs are user-visible, and not a SOC 2 or pen-test control.",
        "",
        "# `/al-bug` severity calibration audit",
        "",
        f"**Rows sampled:** {total}",
        f"**Harm-named:** {named} ({pct:.0f}%)",
        f"**Uncalibrated:** {counts['uncalibrated']}",
        f"**Skipped (no date):** {counts['skipped']}",
        "",
        "Closed harm tokens: `cross-tenant`+`200`; secret/password/apikey with summary/export/packet; `committed`+`manifest`; `200` with `403`/`404`.",
        "",
        "## Uncalibrated citations",
        "",
    ]
    uncalibrated = [
        row for row, label in zip(rows, classifications, strict=True) if label == "uncalibrated"
    ]
    if not uncalibrated:
        lines.append("_None in this sample._")
    else:
        for row in uncalibrated:
            snippet = row.text.replace("\n", " ")[:180]
            lines.append(f"- `{row.zone_id}` — {snippet}")
    if total == 0:
        lines.append("")
        lines.append("Empty sample (no high-impact rows in window).")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample", type=int, default=25)
    parser.add_argument("--since", help="YYYY-MM-DD")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER_PATH)
    args = parser.parse_args(argv)

    since = None
    if args.since:
        since = datetime.strptime(args.since, "%Y-%m-%d").replace(tzinfo=timezone.utc)

    ledger_text = args.ledger.read_text(encoding="utf-8")
    impacts = parse_zone_impacts(ledger_text)
    rows = collect_proven_rows(ledger_text)
    sampled = select_high_impact_rows(rows, impacts, since, args.sample)
    classifications = [classify_row(row.text) for row in sampled]
    report = render_report(sampled, classifications)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(report, encoding="utf-8")
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
