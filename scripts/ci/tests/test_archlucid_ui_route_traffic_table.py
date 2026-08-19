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
    deficit,
    format_overall_weight_total,
    is_buyer_facing_traffic_row,
    is_buyer_facing_ux_row,
    lowest_ux_buyer_rows,
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


def test_parse_rows_eight_columns_with_deficit() -> None:
    table = """
| ID | Path | Hit% | Scores | Weight | Deficit | Section | Notes |
|----|------|------|--------|--------|---------|---------|-------|
| HOM | `/` | 3% | 0 | 0 | 300 | Core review | None |
"""
    rows = parse_rows(table)
    assert len(rows) == 1
    assert rows[0]["id"] == "HOM"
    assert rows[0]["done"] == "No"


def test_parse_rows_nine_columns_with_done() -> None:
    table = """
| ID | Path | Hit% | Scores | Weight | Deficit | Section | Done | Notes |
|----|------|------|--------|--------|---------|---------|------|-------|
| HOM | `/` | 3% | 0 | 0 | 300 | Core review | Yes | None |
"""
    rows = parse_rows(table)
    assert len(rows) == 1
    assert rows[0]["done"] == "Yes"


def test_weight_is_hit_pct_times_score() -> None:
    row = {"pct": "3%", "score": "74"}
    assert weight(row) == 222


def test_deficit_is_hit_pct_times_evidence_gap() -> None:
    row = {"pct": "4%", "score": "78"}
    assert deficit(row) == 88


def test_sort_zero_scores_before_scored_by_deficit_desc() -> None:
    rows = [
        {"id": "HOM", "path": "/", "pct": "3%", "score": "0", "section": "Core review", "done": "No", "notes": "None"},
        {"id": "RE", "path": "/reviews", "pct": "12%", "score": "0", "section": "Core review", "done": "No", "notes": "None"},
        {"id": "ASK", "path": "/ask", "pct": "4%", "score": "78", "section": "Core review", "done": "No", "notes": "None"},
        {"id": "AL", "path": "/alerts", "pct": "3%", "score": "61", "section": "Alerts/gov", "done": "No", "notes": "None"},
    ]
    sorted_rows = sort_rows(rows)
    assert [row["id"] for row in sorted_rows] == ["RE", "HOM", "AL", "ASK"]


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


def test_configuration_reference_help_is_excluded_from_buyer_ux_ranking() -> None:
    con_row = {
        "id": "CON",
        "path": "/help/configuration-reference",
        "pct": "0.03%",
        "score": "62,73",
        "section": "Internal",
        "notes": "Admin internal-runbook",
    }

    assert not is_buyer_facing_ux_row(con_row)

    rows = [
        con_row,
        {
            "id": "HOM",
            "path": "/",
            "pct": "3%",
            "score": "74,80",
            "section": "Core review",
            "notes": "Home",
        },
    ]

    assert lowest_ux_buyer_rows(rows, limit=10) == [rows[1]]


def test_demo_explain_is_excluded_from_buyer_ux_ranking() -> None:
    dex_row = {
        "id": "DEX",
        "path": "/demo/explain",
        "pct": "0%",
        "score": "58,74",
        "section": "Internal",
        "notes": "Internal demo explain",
    }

    assert not is_buyer_facing_ux_row(dex_row)

    rows = [
        dex_row,
        {
            "id": "HOM",
            "path": "/",
            "pct": "3%",
            "score": "74,80",
            "section": "Core review",
            "notes": "Home",
        },
    ]

    assert lowest_ux_buyer_rows(rows, limit=10) == [rows[1]]


def test_internal_section_rows_are_excluded_from_buyer_ux_ranking() -> None:
    row = {
        "id": "FOO",
        "path": "/help/example",
        "pct": "0.1%",
        "score": "50,50",
        "section": "Internal",
        "notes": "Example",
    }

    assert not is_buyer_facing_ux_row(row)


def test_internal_platform_rows_are_excluded_from_overall_weight() -> None:
    internal_row = {
        "id": "ING",
        "path": "/internal/agent-model-catalog",
        "pct": "0.02%",
        "score": "0,100",
        "section": "Internal",
        "notes": "Internal platform catalog",
    }
    buyer_row = {"pct": "3%", "score": "74,80", "path": "/", "section": "Core review"}

    assert not is_buyer_facing_traffic_row(internal_row)
    assert format_overall_weight_total([internal_row, buyer_row]) == format_overall_weight_total([buyer_row])
