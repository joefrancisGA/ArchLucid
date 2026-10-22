"""Tests for SAQ RC release gate."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from report_saq_release_gate import build_saq_release_gate, parse_saq_rows  # noqa: E402


def test_open_p0_saq_without_waiver_holds() -> None:
    rows = [
        {
            "id": "SAQ-001",
            "priority": "P0",
            "status": "Open",
            "question": "Can this ship?",
            "resolution": "Needs owner decision.",
        }
    ]

    payload = build_saq_release_gate(rows)

    assert payload["disposition"] == "HOLD"
    assert payload["openP0Count"] == 1
    assert payload["blockingReasons"] == ["SAQ-001 is open P0 and has no release waiver"]


def test_open_p0_saq_with_waiver_passes_when_no_other_open_items() -> None:
    rows = [
        {
            "id": "SAQ-001",
            "priority": "P0",
            "status": "Open",
            "question": "Can this ship?",
            "resolution": "Waived for this RC.",
        }
    ]
    waiver = {"waivers": [{"saqId": "SAQ-001", "owner": "release-owner"}]}

    payload = build_saq_release_gate(rows, waiver=waiver)

    assert payload["disposition"] == "PASS"
    assert payload["waivedOpenP0Count"] == 1


def test_open_p1_saq_warns_without_waiver() -> None:
    rows = [
        {
            "id": "SAQ-010",
            "priority": "P1",
            "status": "Open",
            "question": "Should this harden?",
            "resolution": "Needs follow-up.",
        }
    ]

    payload = build_saq_release_gate(rows)

    assert payload["disposition"] == "WARN"
    assert payload["warningReasons"] == ["SAQ-010 is open P1 and has no release waiver"]


def test_parse_saq_markdown_table_rows() -> None:
    markdown = """
| ID | Priority | Status | Question | Resolution |
| --- | --- | --- | --- | --- |
| **SAQ-001** | P0 | **Open** | Scope? | Needs owner decision. |
| **SAQ-002** | P1 | **Resolved** | Done? | Closed. |
"""

    rows = parse_saq_rows(markdown)

    assert [row["id"] for row in rows] == ["SAQ-001", "SAQ-002"]
    assert rows[0]["priority"] == "P0"
    assert rows[0]["status"] == "Open"
