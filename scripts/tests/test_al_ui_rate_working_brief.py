#!/usr/bin/env python3
"""Guard: /al-ui-rate command must rate Working as an instrument, not buyer demo (WS-07)."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
AL_UI_RATE = REPO_ROOT / ".cursor" / "commands" / "al-ui-rate.md"
AL_UI_RATE_LOWEST = REPO_ROOT / ".cursor" / "commands" / "al-ui-rate-lowest.md"
OPERATOR_MODES = REPO_ROOT / "docs" / "library" / "OPERATOR_UI_EXPERIENCE_MODES.md"

WORKING_BRIEF_MARKER = "all-day professional architecture review instrument"
GUIDED_BRIEF_MARKER = "design lead for Microsoft Azure Portal"
DEFAULT_WORKING_MARKER = "Default: Working"
BUYER_WALKTHROUGH_REFUSAL = "buyer-walkthrough forbidden on Working seat"
LOWEST_GUIDED_MODE = "Resolved mode: Guided/demo"


def test_al_ui_rate_has_working_and_guided_briefs() -> None:
    text = AL_UI_RATE.read_text(encoding="utf-8")
    assert WORKING_BRIEF_MARKER in text
    assert GUIDED_BRIEF_MARKER in text
    assert DEFAULT_WORKING_MARKER in text
    assert "buyer-walkthrough" in text
    assert BUYER_WALKTHROUGH_REFUSAL in text


def test_al_ui_rate_lowest_uses_guided_demo_brief() -> None:
    text = AL_UI_RATE_LOWEST.read_text(encoding="utf-8")
    assert LOWEST_GUIDED_MODE in text
    assert "Guided/demo critique brief" in text


def test_operator_modes_documents_working_not_buyer_target() -> None:
    text = OPERATOR_MODES.read_text(encoding="utf-8")
    assert "Working is not an `/al-ui-rate` buyer-confidence target" in text
