"""Shared helpers for the owner UI route traffic estimates workbook."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

BACKTICK = chr(96)
REPO_ROOT = Path(__file__).resolve().parents[2]
OWNER_DOC = REPO_ROOT / ".local/owner/ui_route_traffic_estimates.md"
LEGACY_DOC = REPO_ROOT / "docs/architecture/ui_route_traffic_estimates.md"
TEMPLATE_DOC = REPO_ROOT / "docs/architecture/ui_route_traffic_estimates.template.md"
DOC = OWNER_DOC


def ensure_owner_workbook(*, migrate_legacy: bool = True) -> Path:
    """Create the owner workbook from legacy or template when missing."""
    if OWNER_DOC.is_file():
        return OWNER_DOC

    OWNER_DOC.parent.mkdir(parents=True, exist_ok=True)

    if migrate_legacy and LEGACY_DOC.is_file():
        shutil.copyfile(LEGACY_DOC, OWNER_DOC)
        return OWNER_DOC

    if TEMPLATE_DOC.is_file():
        shutil.copyfile(TEMPLATE_DOC, OWNER_DOC)
        return OWNER_DOC

    raise FileNotFoundError(
        f"Owner workbook missing at {OWNER_DOC}. "
        f"Copy {TEMPLATE_DOC.name} into .local/owner/ or run "
        "scripts/ci/bootstrap-ui-route-traffic-owner-workbook.py."
    )


def parse_hit_pct(value: str) -> float:
    return float(value.strip().replace("%", ""))


def parse_rows(table_text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for line in table_text.splitlines():
        if not line.startswith("| ") or line.startswith("| ID") or line.startswith("|----"):
            continue
        parts = [part.strip() for part in line.strip("|").split("|")]
        if len(parts) == 7:
            row_id, path, pct, score, _weight, section, notes = parts
        elif len(parts) == 8:
            row_id, path, pct, score, _weight, _deficit, section, notes = parts
        else:
            continue
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


def deficit(row: dict[str, str]) -> float:
    return parse_hit_pct(row["pct"]) * (100 - parse_score(row))


def parse_score(row: dict[str, str]) -> int:
    return int(row["score"])


def sort_key(row: dict[str, str]) -> tuple[float | int, ...]:
    score = parse_score(row)

    if score == 0:
        # Unscored rows first; highest Deficit (= Hit% × 100) first; path A→Z on ties.
        return (0, -deficit(row), row["path"])

    # Scored rows: Deficit (= Hit% × (100 − score)) descending; path A→Z on ties.
    return (1, -deficit(row), row["path"])


def sort_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return sorted(rows, key=sort_key)


def format_weight_value(row: dict[str, str]) -> str:
    row_weight = weight(row)
    if row_weight == int(row_weight):
        return str(int(row_weight))
    return f"{row_weight:g}"


def format_deficit_value(row: dict[str, str]) -> str:
    row_deficit = deficit(row)
    if row_deficit == int(row_deficit):
        return str(int(row_deficit))
    return f"{row_deficit:g}"


def overall_weight_total(rows: list[dict[str, str]]) -> float:
    return sum(weight(row) for row in rows)


def overall_weight_maximum(rows: list[dict[str, str]]) -> float:
    return sum(parse_hit_pct(row["pct"]) * 100 for row in rows)


def format_overall_weight_total(rows: list[dict[str, str]]) -> str:
    maximum = overall_weight_maximum(rows)

    if maximum == 0:
        return "0%"

    actual = overall_weight_total(rows)
    pct = actual / maximum * 100
    return f"{pct:.2f}%"


def render_table(rows: list[dict[str, str]]) -> list[str]:
    lines = [
        "## Master table (score 0 first; then Deficit desc; ties A→Z by path)",
        "",
        "| ID | Path | Hit% | Scores | Weight | Deficit | Section | Notes |",
        "|----|------|------|--------|--------|---------|---------|-------|",
    ]
    for row in rows:
        lines.append(
            f"| {row['id']} | `{row['path']}` | {row['pct']} | {row['score']} | "
            f"{format_weight_value(row)} | {format_deficit_value(row)} | {row['section']} | {row['notes']} |"
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
    pattern = r"\*\*OVERALL WEIGHT SCORE:\*\* [^\n]+"
    if re.search(pattern, before):
        return re.sub(pattern, line, before, count=1)

    insert_pattern = r"(\n---\n\n)(?=## Master table)"
    updated, count = re.subn(insert_pattern, f"\\1{line}\n\n", before, count=1)
    return updated if count else before


def write_table(doc: Path, before: str, rows: list[dict[str, str]], after: str) -> None:
    before = update_method_line(before)
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
    intro_pattern = (
        r"until the owner assigns a value\. Row Weight is Hit% × Evidence score(?:\. "
        r"Row Deficit is Hit% × \(100 − Evidence score\))?\.?\n"
        r"OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum\n"
        r"possible \(Hit% × 100 per row\)\."
    )
    intro_replacement = (
        "until the owner assigns a value. Row Weight is Hit% × Evidence score. "
        "Row Deficit is Hit% × (100 − Evidence score).\n"
        "OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum\n"
        "possible (Hit% × 100 per row)."
    )
    updated, count = re.subn(intro_pattern, intro_replacement, text, count=1)
    if count:
        text = updated

    sort_key_line = (
        "Master table sort key: rows with score 0 appear before scored rows; within each group, "
        "sort by Deficit (descending); ties A→Z by path. Weight column is Hit% × Scores. "
        "Deficit column is Hit% × (100 − Scores). OVERALL WEIGHT SCORE is the sum of row Weight "
        "values expressed as a percentage of the maximum possible (Hit% × 100 per row). "
        "ID column: unique shorthand of at most three capital letters per row."
    )
    sort_pattern = (
        r"Master table sort key:.*?ID column: unique shorthand of at most three capital letters per row\."
    )
    updated, count = re.subn(sort_pattern, sort_key_line, text, count=1, flags=re.DOTALL)
    if count:
        return updated

    insert_pattern = r"(possible \(Hit% × 100 per row\)\.)\n\n(Not included:)"
    insert_replacement = rf"\1\n\n{sort_key_line}\n\n\2"
    updated, count = re.subn(insert_pattern, insert_replacement, text, count=1)
    return updated if count else text
