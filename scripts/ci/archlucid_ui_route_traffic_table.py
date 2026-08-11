"""Shared helpers for the owner UI route traffic estimates workbook."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from archlucid_ui_route_catalog import INTERNAL_UX_RANKING_HELP_PATHS

BACKTICK = chr(96)
REPO_ROOT = Path(__file__).resolve().parents[2]
OWNER_DOC = REPO_ROOT / ".local/owner/ui_route_traffic_estimates.md"
LEGACY_DOC = REPO_ROOT / "docs/architecture/ui_route_traffic_estimates.md"
TEMPLATE_DOC = REPO_ROOT / "docs/architecture/ui_route_traffic_estimates.template.md"
DOC = OWNER_DOC

# Scores cell is comma-separated: position 1 Evidence, position 2 UX quality.
# UX is the headline dimension (Weight, Deficit, sort order, OVERALL WEIGHT SCORE).
SCORE_SEPARATOR = ","
EVIDENCE_INDEX = 0
UX_INDEX = 1
SCORE_DIMENSIONS = {"evidence": EVIDENCE_INDEX, "ux": UX_INDEX}
DEFAULT_DONE = "No"
OVERALL_WEIGHT_LABEL = "**OVERALL WEIGHT SCORE:**"
OVERALL_EVIDENCE_LABEL = "**OVERALL EVIDENCE SCORE:**"


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
        done = DEFAULT_DONE
        if len(parts) == 7:
            row_id, path, pct, score, _weight, section, notes = parts
        elif len(parts) == 8:
            row_id, path, pct, score, _weight, _deficit, section, notes = parts
        elif len(parts) == 9:
            row_id, path, pct, score, _weight, _deficit, section, done, notes = parts
            if not done:
                done = DEFAULT_DONE
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
                "done": done,
                "notes": notes,
            }
        )
    return rows


def parse_score_series(row: dict[str, str]) -> list[int]:
    """Split the comma-separated Scores cell into its dimensions."""
    raw = str(row.get("score", "")).strip()

    if not raw:
        return []

    return [int(part.strip()) if part.strip() else 0 for part in raw.split(SCORE_SEPARATOR)]


def _score_at(row: dict[str, str], index: int) -> int:
    series = parse_score_series(row)

    if index >= len(series):
        return 0

    return series[index]


def parse_score(row: dict[str, str]) -> int:
    """Evidence score (Scores position 1)."""
    return _score_at(row, EVIDENCE_INDEX)


def parse_ux_score(row: dict[str, str]) -> int:
    """UX quality score (Scores position 2); 0 means unscored."""
    return _score_at(row, UX_INDEX)


INTERNAL_PATH_PREFIX = "/internal"


def is_internal_path(path: str) -> bool:
    """True for ArchLucid-internal operator routes (excluded from buyer UX rankings)."""
    bare = path.split("?", 1)[0]

    return bare == INTERNAL_PATH_PREFIX or bare.startswith(f"{INTERNAL_PATH_PREFIX}/")


def is_internal_ux_ranking_path(path: str) -> bool:
    """True when a route is excluded from buyer UX scoring despite living outside `/internal`."""
    bare = path.split("?", 1)[0]

    if is_internal_path(path):
        return True

    return bare in INTERNAL_UX_RANKING_HELP_PATHS


def is_internal_ux_section(section: str) -> bool:
    return section.strip().casefold() == "internal"


def is_buyer_facing_ux_row(row: dict[str, str]) -> bool:
    """Buyer-facing rows with a scored UX dimension (position 2 > 0)."""
    if is_internal_ux_ranking_path(row.get("path", "")):
        return False

    if is_internal_ux_section(row.get("section", "")):
        return False

    return parse_ux_score(row) > 0


def lowest_ux_buyer_rows(rows: list[dict[str, str]], *, limit: int = 20) -> list[dict[str, str]]:
    """Return the lowest UX-scored non-internal rows, ascending by UX then path."""
    buyer = [row for row in rows if is_buyer_facing_ux_row(row)]
    buyer.sort(key=lambda row: (parse_ux_score(row), row["path"]))

    if limit < 1:
        return []

    return buyer[:limit]


def format_score_cell(series: list[int]) -> str:
    trimmed = list(series)

    while len(trimmed) > 1 and trimmed[-1] == 0:
        trimmed.pop()

    if not trimmed:
        return "0"

    return SCORE_SEPARATOR.join(str(value) for value in trimmed)


def set_score_dimension(row: dict[str, str], index: int, value: int) -> str:
    """Write one dimension into the Scores cell, preserving the other dimensions."""
    series = parse_score_series(row)

    while len(series) <= index:
        series.append(0)

    series[index] = value
    row["score"] = format_score_cell(series)
    return row["score"]


def weight(row: dict[str, str]) -> float:
    return parse_hit_pct(row["pct"]) * parse_ux_score(row)


def evidence_weight(row: dict[str, str]) -> float:
    return parse_hit_pct(row["pct"]) * parse_score(row)


def deficit(row: dict[str, str]) -> float:
    return parse_hit_pct(row["pct"]) * (100 - parse_ux_score(row))


def sort_key(row: dict[str, str]) -> tuple[float | int, ...]:
    score = parse_ux_score(row)

    if score == 0:
        # Unscored rows first; highest Deficit (= Hit% × 100) first; path A→Z on ties.
        return (0, -deficit(row), row["path"])

    # Scored rows: Deficit (= Hit% × (100 − UX score)) descending; path A→Z on ties.
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


def overall_evidence_total(rows: list[dict[str, str]]) -> float:
    return sum(evidence_weight(row) for row in rows)


def overall_weight_maximum(rows: list[dict[str, str]]) -> float:
    return sum(parse_hit_pct(row["pct"]) * 100 for row in rows)


def _format_total_pct(actual: float, maximum: float) -> str:
    if maximum == 0:
        return "0%"

    return f"{actual / maximum * 100:.2f}%"


def format_overall_weight_total(rows: list[dict[str, str]]) -> str:
    """Headline total: UX weight as a percentage of the maximum possible."""
    return _format_total_pct(overall_weight_total(rows), overall_weight_maximum(rows))


def format_overall_evidence_total(rows: list[dict[str, str]]) -> str:
    """Reference total: the same computation over Scores position 1."""
    return _format_total_pct(overall_evidence_total(rows), overall_weight_maximum(rows))


def render_table(rows: list[dict[str, str]]) -> list[str]:
    lines = [
        "## Master table (UX score 0 first; then Deficit desc; ties A→Z by path)",
        "",
        "| ID | Path | Hit% | Scores | Weight | Deficit | Section | Done | Notes |",
        "|----|------|------|--------|--------|---------|---------|------|-------|",
    ]
    for row in rows:
        lines.append(
            f"| {row['id']} | `{row['path']}` | {row['pct']} | {row['score']} | "
            f"{format_weight_value(row)} | {format_deficit_value(row)} | {row['section']} | "
            f"{row.get('done', DEFAULT_DONE) or DEFAULT_DONE} | {row['notes']} |"
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


def _replace_total_line(text: str, label: str, value: str) -> tuple[str, bool]:
    pattern = re.escape(label) + r" [^\n]+"
    line = f"{label} {value}"

    if re.search(pattern, text) is None:
        return text, False

    return re.sub(pattern, lambda _match: line, text, count=1), True


def upsert_overall_weight_line(before: str, rows: list[dict[str, str]]) -> str:
    ux_line = f"{OVERALL_WEIGHT_LABEL} {format_overall_weight_total(rows)}"
    evidence_line = f"{OVERALL_EVIDENCE_LABEL} {format_overall_evidence_total(rows)}"

    updated, replaced = _replace_total_line(before, OVERALL_WEIGHT_LABEL, format_overall_weight_total(rows))

    if not replaced:
        insert_pattern = r"(\n---\n\n)(?=## Master table)"
        updated, count = re.subn(insert_pattern, lambda match: f"{match.group(1)}{ux_line}\n\n", before, count=1)

        if not count:
            return before

    before = updated
    updated, replaced = _replace_total_line(before, OVERALL_EVIDENCE_LABEL, format_overall_evidence_total(rows))

    if replaced:
        return updated

    updated, count = re.subn(
        re.escape(ux_line),
        lambda _match: f"{ux_line}\n\n{evidence_line}",
        before,
        count=1,
    )
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
    text = _update_dimensions_sentence(text)
    text = _update_intro_sentence(text)
    return _update_sort_key_sentence(text)


def _update_dimensions_sentence(text: str) -> str:
    pattern = (
        r"Page scores: comma-separated 0-100 scores\. Position 1 is Evidence \(traceability,\n"
        r"provenance, sponsor-safe citations\)\..*?"
        r"Default 0[ \n]until the owner assigns a value\."
    )
    replacement = (
        "Page scores: comma-separated 0-100 scores. Position 1 is Evidence (traceability,\n"
        "provenance, sponsor-safe citations). Position 2 is UX quality, scored against\n"
        "docs/library/UI_UX_SCORING_RUBRIC.md. Default 0 until the owner assigns a value."
    )
    updated, count = re.subn(pattern, lambda _match: replacement, text, count=1, flags=re.DOTALL)
    return updated if count else text


def _update_intro_sentence(text: str) -> str:
    pattern = (
        r"until the owner assigns a value\.[ \n]Row Weight is Hit% × (?:Evidence|UX) score\."
        r"(?:[ \n]Row Deficit is Hit% × \(100 − (?:Evidence|UX) score\)\.)?\n"
        r"OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum\n"
        r"possible \(Hit% × 100 per row\)\."
        r"(?: OVERALL EVIDENCE SCORE is the same computation\nover Scores position 1\.)?"
    )
    replacement = (
        "until the owner assigns a value. Row Weight is Hit% × UX score.\n"
        "Row Deficit is Hit% × (100 − UX score).\n"
        "OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum\n"
        "possible (Hit% × 100 per row). OVERALL EVIDENCE SCORE is the same computation\n"
        "over Scores position 1."
    )
    updated, count = re.subn(pattern, lambda _match: replacement, text, count=1)
    return updated if count else text


_SORT_KEY_SENTENCE = (
    "Master table sort key: rows with UX score 0 (unscored) appear before scored rows; within each "
    "group, sort by Deficit (descending); ties A→Z by path. Weight column is Hit% × UX score. "
    "Deficit column is Hit% × (100 − UX score). OVERALL WEIGHT SCORE is the sum of row Weight "
    "values expressed as a percentage of the maximum possible (Hit% × 100 per row). "
    "ID column: unique shorthand of at most three capital letters per row."
)


def _update_sort_key_sentence(text: str) -> str:
    pattern = (
        r"Master table sort key:.*?ID column: unique shorthand of at most three capital letters per row\."
    )
    updated, count = re.subn(
        pattern,
        lambda _match: _SORT_KEY_SENTENCE,
        text,
        count=1,
        flags=re.DOTALL,
    )

    if count:
        return updated

    insert_pattern = (
        r"(possible \(Hit% × 100 per row\)\."
        r"(?: OVERALL EVIDENCE SCORE is the same computation\nover Scores position 1\.)?)"
        r"\n\n(Not included:)"
    )
    updated, count = re.subn(
        insert_pattern,
        lambda match: f"{match.group(1)}\n\n{_SORT_KEY_SENTENCE}\n\n{match.group(2)}",
        text,
        count=1,
    )
    return updated if count else text
