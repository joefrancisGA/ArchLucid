"""Tests for TB-165 assessment score consistency guard."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from check_assessment_score_consistency import check_assessment_score_consistency  # noqa: E402


def test_latest_assessment_table_matches_headline() -> None:
    path = _REPO_ROOT / "docs" / "assessments" / "LATEST.md"

    if not path.is_file():
        return

    text = path.read_text(encoding="utf-8", errors="replace")
    violations = check_assessment_score_consistency(text)

    assert violations == [], "\n".join(violations)
