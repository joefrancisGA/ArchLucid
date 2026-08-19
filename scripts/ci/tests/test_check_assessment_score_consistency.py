"""Tests for TB-165 / TB-354 assessment score consistency guard."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from check_assessment_score_consistency import (  # noqa: E402
    _parse_rows,
    check_assessment_score_consistency,
)


def test_latest_assessment_table_matches_headline() -> None:
    path = _REPO_ROOT / "docs" / "assessments" / "LATEST.md"

    if not path.is_file():
        return

    text = path.read_text(encoding="utf-8", errors="replace")
    rows = _parse_rows(text)

    if sum(row.weight for row in rows) != 50:
        return

    violations = check_assessment_score_consistency(text)

    assert violations == [], "\n".join(violations)


def test_compact_rescore_format_matches_headline() -> None:
    text = """
# ArchLucid Assessment – (A) Headline Readiness: 61.40%

| Quality | Score (was) | Score (now) | Weight | Weighted impact | Deficiency signal |
| --- | ---: | ---: | ---: | ---: | ---: |
| Insight Density | 50 | **50** | 10 | 10.00 | 500.00 |
| Cognitive Load | 58 | **59** | 8 | 9.44 | 328.00 |
| Time-to-Value | 58 | **58** | 7 | 8.12 | 294.00 |
| AI/Agent Readiness | 70 | **72** | 8 | 11.52 | 224.00 |
| Proof-of-ROI Readiness | 52 | **52** | 5 | 5.20 | 240.00 |
| Correctness | 76 | **78** | 8 | 12.48 | 176.00 |
| Differentiability | 58 | **58** | 4 | 4.64 | 168.00 |
| **Total** | | | **50** | **61.40%** | |

**Sum(score × weight) =** 500 + 472 + 406 + 576 + 260 + 624 + 232 = **3070**
**(A) = 3070 / 50 = 61.40%**
"""
    violations = check_assessment_score_consistency(text)

    assert violations == [], "\n".join(violations)


def test_detects_weight_sum_mismatch() -> None:
    text = """
# ArchLucid Assessment – (A) Headline Readiness: 50.00%

| Quality | Score | Weight |
| --- | ---: | ---: |
| Cognitive Load | 50 | 8 |
| Insight Density | 50 | 8 |
"""
    violations = check_assessment_score_consistency(text)

    assert any("weights sum" in v.lower() for v in violations)
