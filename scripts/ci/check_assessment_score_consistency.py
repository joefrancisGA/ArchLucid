#!/usr/bin/env python3
"""TB-165: Detect headline/table arithmetic drift in assessment markdown."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

_TABLE_ROW = re.compile(
    r"^\|\s*\d+\s*\|\s*(?P<quality>[^|]+)\|\s*(?P<score>\d+)\s*\|\s*(?P<weight>\d+)\s*\|",
    re.MULTILINE,
)
_HEADLINE_PCT = re.compile(
    r"Headline Readiness:\s*([\d.]+)\s*%",
    re.IGNORECASE,
)
_WEIGHTED_CALC = re.compile(
    r"total weighted points\s*=\s*`([\d,]+)\s*/\s*([\d,]+)\s*=\s*([\d.]+)\s*%`",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class QualityRow:
    quality: str
    score: int
    weight: int


def _parse_rows(text: str) -> list[QualityRow]:
    rows: list[QualityRow] = []

    for match in _TABLE_ROW.finditer(text):
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
        violations.append("No weighted quality table rows found (expected section 4 table).")
        return violations

    computed_points = sum(row.score * row.weight for row in rows)
    computed_max = sum(row.weight * 100 for row in rows)
    computed_pct = round((computed_points / computed_max) * 100, 2) if computed_max else 0.0

    headline_matches = list(_HEADLINE_PCT.finditer(text))
    calc_matches = list(_WEIGHTED_CALC.finditer(text))

    if headline_matches:
        headline_pct = float(headline_matches[0].group(1))

        if abs(headline_pct - computed_pct) > 0.05:
            violations.append(
                f"Headline {headline_pct}% differs from table-derived {computed_pct}% "
                f"({computed_points}/{computed_max})."
            )

    if calc_matches:
        declared_points = int(calc_matches[0].group(1).replace(",", ""))
        declared_max = int(calc_matches[0].group(2).replace(",", ""))
        declared_pct = float(calc_matches[0].group(3))

        if declared_points != computed_points:
            violations.append(
                f"Declared numerator {declared_points} != sum(score*weight) {computed_points}."
            )

        if declared_max != computed_max:
            violations.append(
                f"Declared denominator {declared_max} != sum(weight*100) {computed_max}."
            )

        if abs(declared_pct - computed_pct) > 0.05:
            violations.append(
                f"Declared percentage {declared_pct}% != recomputed {computed_pct}%."
            )

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assessment-path",
        type=Path,
        default=Path("docs/assessments/LATEST.md"),
    )
    args = parser.parse_args(argv)

    path = args.assessment_path

    if not path.is_file():
        print(f"::error::Missing assessment file {path}")
        return 1

    text = path.read_text(encoding="utf-8", errors="replace")
    violations = check_assessment_score_consistency(text)

    if violations:
        for item in violations:
            print(f"::error::{item}")
        return 1

    print(f"Assessment score consistency OK: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
