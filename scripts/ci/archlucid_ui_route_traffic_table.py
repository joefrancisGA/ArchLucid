"""Shared helpers for docs/architecture/ui_route_traffic_estimates.md master table."""

from __future__ import annotations

import re
from pathlib import Path

BACKTICK = chr(96)
DOC = Path(__file__).resolve().parents[2] / "docs/architecture/ui_route_traffic_estimates.md"


def parse_hit_pct(value: str) -> float:
    return float(value.strip().replace("%", ""))


def parse_rows(table_text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for line in table_text.splitlines():
        if not line.startswith("| ") or line.startswith("| ID") or line.startswith("|----"):
            continue
        parts = [part.strip() for part in line.strip("|").split("|")]
        if len(parts) != 7:
            continue
        row_id, path, pct, score, _weight, section, notes = parts
        path = path.strip(BACKTICK)
        rows.append(
            {
                "id": row_id,
                "path": path,
                "pct": pct,
                "score": score,
                "section": section,
                "notes": notes,
            }
        )
    return rows


def weight(row: dict[str, str]) -> float:
    return parse_hit_pct(row["pct"]) * int(row["score"])


def parse_score(row: dict[str, str]) -> int:
    return int(row["score"])


def sort_key(row: dict[str, str]) -> tuple[float | int, ...]:
    score = parse_score(row)

    if score == 0:
        # Zero-weight rows: highest Hit% first; path A→Z on ties.
        return (0, -parse_hit_pct(row["pct"]), row["path"])

    # Scored rows: Weight descending; path A→Z on ties.
    return (1, -weight(row), row["path"])


def sort_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return sorted(rows, key=sort_key)


def format_weight_value(row: dict[str, str]) -> str:
    row_weight = weight(row)
    if row_weight == int(row_weight):
        return str(int(row_weight))
    return f"{row_weight:g}"


def overall_weight_total(rows: list[dict[str, str]]) -> float:
    return sum(weight(row) for row in rows)


def format_overall_weight_total(rows: list[dict[str, str]]) -> str:
    total = overall_weight_total(rows)
    if total == int(total):
        return str(int(total))
    return f"{total:.2f}"


def render_table(rows: list[dict[str, str]]) -> list[str]:
    lines = [
        "## Master table (score 0: Hit% desc; scored: Weight desc; ties A→Z by path)",
        "",
        "| ID | Path | Hit% | Scores | Weight | Section | Notes |",
        "|----|------|------|--------|--------|---------|-------|",
    ]
    for row in rows:
        lines.append(
            f"| {row['id']} | `{row['path']}` | {row['pct']} | {row['score']} | "
            f"{format_weight_value(row)} | {row['section']} | {row['notes']} |"
        )
    return lines


def split_document(text: str, doc: Path = DOC) -> tuple[str, str, str]:
    marker = "## Master table"
    if marker not in text:
        raise ValueError(f"Missing master table section in {doc}")
    before, rest = text.split(marker, 1)
    table_and_rest = rest.split("\n---\n", 1)
    if len(table_and_rest) != 2:
        raise ValueError("Could not locate table end delimiter '---'")
    table_body, after = table_and_rest
    return before, table_body, after


def upsert_overall_weight_line(before: str, rows: list[dict[str, str]]) -> str:
    line = f"**OVERALL WEIGHT SCORE:** {format_overall_weight_total(rows)}"
    pattern = r"\*\*OVERALL WEIGHT SCORE:\*\* [0-9.]+"
    if re.search(pattern, before):
        return re.sub(pattern, line, before, count=1)

    insert_pattern = r"(\n---\n\n)(?=## Master table)"
    updated, count = re.subn(insert_pattern, f"\\1{line}\n\n", before, count=1)
    return updated if count else before


def write_table(doc: Path, before: str, rows: list[dict[str, str]], after: str) -> None:
    before = upsert_overall_weight_line(before, rows)
    new_table = "\n".join(render_table(rows))
    doc.write_text(before + new_table + "\n\n---\n" + after, encoding="utf-8")


def find_row(rows: list[dict[str, str]], row_id: str) -> dict[str, str] | None:
    normalized = row_id.strip().upper()
    return next((row for row in rows if row["id"].upper() == normalized), None)


def sanitize_note_text(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return "None"
    cleaned = cleaned.replace("|", "-")
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = cleaned.replace("\n", "<br>")
    return cleaned


def merge_note(existing: str, addition: str, replace: bool) -> str:
    new_text = sanitize_note_text(addition)
    if replace or existing in ("", "None"):
        return new_text
    return f"{existing}; {new_text}"


def update_method_line(text: str) -> str:
    pattern = (
        r"Master table sort key:.*?ID column: unique shorthand of at most three capital letters per row\."
    )
    replacement = (
        "Master table sort key: score 0 rows by Hit% (descending); scored rows by Weight "
        "(descending); ties A→Z by path. Weight column is Hit% × Scores (percentage points × score). "
        "OVERALL WEIGHT SCORE is the sum of all row Weight values. "
        "ID column: unique shorthand of at most three capital letters per row."
    )
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    return updated if count else text
