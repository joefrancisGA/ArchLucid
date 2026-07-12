"""Unit tests for the ui_route_traffic_estimates.md master table helpers."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from archlucid_ui_route_traffic_table import (  # noqa: E402
    DOC,
    OWNER_DOC,
    format_overall_weight_total,
    parse_rows,
    sort_key,
    sort_rows,
    weight,
)


def test_parse_rows_seven_columns() -> None:
    table = """
| ID | Path | Hit% | Scores | Weight | Section | Notes |
|----|------|------|--------|--------|---------|-------|
| HOM | `/` | 3% | 0 | 0 | Core review | None |
| ASK | `/ask` | 4% | 78 | 312 | Core review | None |
"""
    rows = parse_rows(table)
    assert len(rows) == 2
    assert rows[0]["id"] == "HOM"
    assert rows[1]["path"] == "/ask"


def test_weight_is_hit_pct_times_score() -> None:
    row = {"pct": "3%", "score": "74"}
    assert weight(row) == 222


def test_sort_zero_scores_by_hit_desc_then_scored_by_weight_desc() -> None:
    rows = [
        {"id": "HOM", "path": "/", "pct": "3%", "score": "0", "section": "Core review", "notes": "None"},
        {"id": "RE", "path": "/reviews", "pct": "12%", "score": "0", "section": "Core review", "notes": "None"},
        {"id": "ASK", "path": "/ask", "pct": "4%", "score": "78", "section": "Core review", "notes": "None"},
        {"id": "AL", "path": "/alerts", "pct": "3%", "score": "61", "section": "Alerts/gov", "notes": "None"},
    ]
    sorted_rows = sort_rows(rows)
    assert [row["id"] for row in sorted_rows] == ["RE", "HOM", "ASK", "AL"]


def test_sort_key_groups_zero_scores_before_scored_rows() -> None:
    zero = {"path": "/reviews", "pct": "12%", "score": "0"}
    scored = {"path": "/ask", "pct": "4%", "score": "78"}
    assert sort_key(zero) < sort_key(scored)


def test_overall_weight_total() -> None:
    rows = [
        {"pct": "3%", "score": "74"},
        {"pct": "4%", "score": "78"},
    ]
    assert format_overall_weight_total(rows) == "76.29%"


def test_default_doc_points_at_owner_workbook() -> None:
    assert DOC == OWNER_DOC
    assert OWNER_DOC.name == "ui_route_traffic_estimates.md"
    assert ".local" in OWNER_DOC.as_posix()
