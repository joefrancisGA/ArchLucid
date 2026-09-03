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
    TEMPLATE_DOC,
    cap_ux_score,
    cap_ux_scores,
    deficit,
    format_overall_weight_total,
    is_buyer_facing_traffic_row,
    is_buyer_facing_ux_row,
    lowest_ux_buyer_rows,
    parse_rows,
    parse_score,
    parse_ux_score,
    sort_key,
    sort_rows,
    split_document,
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


def test_cap_ux_score_clamps_position_two_and_preserves_evidence() -> None:
    row = {"id": "SIG", "path": "/signup", "pct": "0.2%", "score": "70,88"}

    assert cap_ux_score(row, 87) is True
    assert row["score"] == "70,87"
    assert parse_score(row) == 70
    assert parse_ux_score(row) == 87


def test_cap_ux_score_leaves_scores_at_or_below_max_unchanged() -> None:
    at_max = {"score": "80,87"}
    below = {"score": "80,86"}

    assert cap_ux_score(at_max, 87) is False
    assert at_max["score"] == "80,87"
    assert cap_ux_score(below, 87) is False
    assert below["score"] == "80,86"


def test_cap_ux_score_clamps_legacy_single_dimension_without_inventing_evidence() -> None:
    row = {"score": "100"}

    assert cap_ux_score(row, 87) is True
    assert row["score"] == "87"
    assert parse_ux_score(row) == 87


def test_cap_ux_score_rejects_negative_max() -> None:
    try:
        cap_ux_score({"score": "90,90"}, -1)
    except ValueError as error:
        assert "max_value" in str(error)
        return

    raise AssertionError("expected ValueError for negative max_value")


def test_cap_ux_scores_returns_only_rows_that_changed() -> None:
    rows = [
        {"id": "WHY", "path": "/why", "pct": "0.04%", "score": "58,93"},
        {"id": "HOM", "path": "/", "pct": "3%", "score": "82,80"},
        {"id": "HEE", "path": "/help/engineering-troubleshooting", "pct": "0.02%", "score": "0,100"},
    ]

    changed = cap_ux_scores(rows, 87)

    assert [row["id"] for row, _previous in changed] == ["WHY", "HEE"]
    assert changed[0][1] == "58,93"
    assert rows[0]["score"] == "58,87"
    assert rows[1]["score"] == "82,80"
    assert rows[2]["score"] == "0,87"


def test_tracked_template_ux_scores_do_not_exceed_87() -> None:
    _before, table_body, _after = split_document(TEMPLATE_DOC.read_text(encoding="utf-8"), TEMPLATE_DOC)
    over = [
        f"{row['id']} {row['path']} scores={row['score']} ux={parse_ux_score(row)}"
        for row in parse_rows(table_body)
        if parse_ux_score(row) > 87
    ]

    assert over == [], "UX scores above 87:\n" + "\n".join(over)
