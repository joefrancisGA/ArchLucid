#!/usr/bin/env python3
"""TB-165: Detect headline/table arithmetic drift in assessment markdown."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

_SECTION_SCORE = re.compile(
    r"### \d+\.\s*(?P<quality>.+?)\s*\n\s*\*\s*\*\*Score:\*\*\s*(?P<score>\d+)\s*\n\s*\*\s*\*\*Weight:\*\*\s*(?P<weight>\d+)",
    re.MULTILINE,
)
_HEADLINE_PCT = re.compile(
    r"Headline Readiness:\s*([\d.]+)\s*%",
    re.IGNORECASE,
)

@dataclass(frozen=True)
class QualityRow:
    quality: str
    score: int
    weight: int

def _parse_rows(text: str) -> list[QualityRow]:
    rows: list[QualityRow] = []
    for match in _SECTION_SCORE.finditer(text):
        rows.append(
            QualityRow(
                quality=match.group("quality").strip(),
                score=int(match.group("score")),
                weight=int(match.group("weight")),
            )
        )
    return rows

def check_assessment_score_consistency(text: str) -> list[str]:
    violations: list[str] = []
    rows = _parse_rows(text)

    if not rows:
        return ["No weighted quality sections found."]

    total_weight = sum(r.weight for r in rows)
    total_points = sum(r.score * r.weight for r in rows)

    if total_weight == 0:
        return ["Total weight is zero."]

    expected_pct = round((total_points / total_weight), 2)

    headline_match = _HEADLINE_PCT.search(text)
    if not headline_match:
        violations.append("Headline readiness percentage not found.")
    else:
        headline_pct = float(headline_match.group(1))
        if abs(headline_pct - expected_pct) > 0.02:
            violations.append(
                f"Headline readiness ({headline_pct}%) does not match computed "
                f"score ({expected_pct}% from {total_points}/{total_weight})."
            )

    return violations

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--assessment-path", default="docs/assessments/LATEST.md")
    args = parser.parse_args()

    path = Path(args.assessment_path)
    if not path.is_file():
        print(f"::error::Assessment file not found: {path}", file=sys.stderr)
        return 1

    text = path.read_text(encoding="utf-8")
    violations = check_assessment_score_consistency(text)

    if violations:
        for v in violations:
            print(f"::error::{v}", file=sys.stderr)
        return 1

    print("Assessment scores are consistent.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
