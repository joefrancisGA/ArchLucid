#!/usr/bin/env python3
"""TB-165 / TB-354: Detect headline/table arithmetic drift in assessment markdown."""

from __future__ import annotations

import argparse
import glob
import re
import sys
from dataclasses import dataclass
from pathlib import Path

_SECTION_SCORE = re.compile(
    r"### \d+\.\s*(?P<quality>.+?)\s*\n\s*\*\s*\*\*Score:\*\*\s*(?P<score>\d+)\s*\n\s*\*\s*\*\*Weight:\*\*\s*(?P<weight>\d+)",
    re.MULTILINE,
)
_TABLE_ROW_COMPACT = re.compile(
    r"^\|\s*(?P<quality>(?!Quality|Total|Metric|---|\*\*).+?)\s*\|\s*\d+\s*\|\s*(?:\*\*)?(?P<score>\d+)(?:\*\*)?\s*\|\s*(?P<weight>\d+)",
    re.MULTILINE,
)
_TABLE_ROW_SIMPLE = re.compile(
    r"^\|\s*(?P<quality>(?!Quality|Total|Metric|---|\*\*).+?)\s*\|\s*(?:\*\*)?(?P<score>\d+)(?:\*\*)?\s*\|\s*(?P<weight>\d+)\s*\|",
    re.MULTILINE,
)
_HEADLINE_PATTERNS = (
    re.compile(r"\(A\)\s*Headline Readiness:\s*\*?\*?\s*([\d.]+)\s*%", re.IGNORECASE),
    re.compile(r"Headline Readiness:\s*\*?\*?\s*([\d.]+)\s*%", re.IGNORECASE),
    re.compile(r"Overall Headline Readiness:\s*\*?\*?\s*([\d.]+)\s*%", re.IGNORECASE),
)
_APPENDIX_SUM = re.compile(
    r"Sum\(score\s*[×x]\s*weight\)\s*=\s*(?P<terms>[\d+\s]+)=\s*\*\*(?P<total>\d+)\*\*",
    re.IGNORECASE,
)
_APPENDIX_PCT = re.compile(
    r"\(A\)\s*=\s*(?P<total>\d+)\s*/\s*50\s*=\s*([\d.]+)\s*%",
    re.IGNORECASE,
)

_CANONICAL_QUALITIES = frozenset(
    {
        "insight density",
        "cognitive load",
        "time-to-value",
        "ai/agent readiness",
        "proof-of-roi readiness",
        "correctness",
        "differentiability",
    }
)


@dataclass(frozen=True)
class QualityRow:
    quality: str
    score: int
    weight: int


def _is_canonical_quality(quality: str) -> bool:
    normalized = quality.strip().lower()
    normalized = normalized.removeprefix("**").removesuffix("**").strip()
    return normalized in _CANONICAL_QUALITIES


def _parse_rows(text: str) -> list[QualityRow]:
    rows: list[QualityRow] = []
    seen: set[str] = set()

    def add_row(quality: str, score: int, weight: int) -> None:
        if not _is_canonical_quality(quality):
            return

        key = quality.strip().lower()
        if key in seen:
            return

        seen.add(key)
        rows.append(QualityRow(quality=quality.strip(), score=score, weight=weight))

    for match in _SECTION_SCORE.finditer(text):
        add_row(match.group("quality"), int(match.group("score")), int(match.group("weight")))

    compact_spans: set[int] = set()
    for match in _TABLE_ROW_COMPACT.finditer(text):
        compact_spans.add(match.start())
        add_row(match.group("quality"), int(match.group("score")), int(match.group("weight")))

    for match in _TABLE_ROW_SIMPLE.finditer(text):
        if match.start() in compact_spans:
            continue

        line_end = text.find("\n", match.start())
        line = text[match.start() : line_end if line_end >= 0 else len(text)]
        if re.search(r"\|\s*\*\*\d+\*\*", line):
            continue

        add_row(match.group("quality"), int(match.group("score")), int(match.group("weight")))

    return rows


def _parse_headline_pct(text: str) -> float | None:
    for pattern in _HEADLINE_PATTERNS:
        match = pattern.search(text)
        if match:
            return float(match.group(1))

    return None


def check_assessment_score_consistency(text: str) -> list[str]:
    violations: list[str] = []
    rows = _parse_rows(text)

    if not rows:
        return ["No weighted quality sections found."]

    total_weight = sum(r.weight for r in rows)
    total_points = sum(r.score * r.weight for r in rows)

    if total_weight == 0:
        return ["Total weight is zero."]

    if total_weight != 50:
        violations.append(
            f"Quality weights sum to {total_weight}, expected exactly 50."
        )

    expected_pct = round((total_points / total_weight), 2)

    headline_pct = _parse_headline_pct(text)
    if headline_pct is None:
        violations.append("Headline readiness percentage not found.")
    elif abs(headline_pct - expected_pct) > 0.02:
        violations.append(
            f"Headline readiness ({headline_pct}%) does not match computed "
            f"score ({expected_pct}% from {total_points}/{total_weight})."
        )

    appendix_sum = _APPENDIX_SUM.search(text)
    if appendix_sum:
        terms = [int(x) for x in appendix_sum.group("terms").split("+")]
        appendix_total = int(appendix_sum.group("total"))
        if sum(terms) != appendix_total:
            violations.append(
                f"Appendix term sum ({sum(terms)}) does not match stated total ({appendix_total})."
            )

        if appendix_total != total_points:
            violations.append(
                f"Appendix total ({appendix_total}) does not match table total ({total_points})."
            )

    appendix_pct = _APPENDIX_PCT.search(text)
    if appendix_pct and headline_pct is not None:
        appendix_headline = float(appendix_pct.group(2))
        if abs(appendix_headline - headline_pct) > 0.02:
            violations.append(
                f"Appendix headline ({appendix_headline}%) does not match title headline ({headline_pct}%)."
            )

    return violations


def _check_file(path: Path) -> list[str]:
    if not path.is_file():
        return [f"Assessment file not found: {path}"]

    text = path.read_text(encoding="utf-8")
    rows = _parse_rows(text)

    if not rows:
        return []

    violations = check_assessment_score_consistency(text)
    return [f"{path}: {v}" for v in violations]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--assessment-path", default="docs/assessments/LATEST.md")
    parser.add_argument(
        "--file",
        dest="assessment_path",
        help="Alias for --assessment-path.",
    )
    parser.add_argument(
        "--all-latest",
        action="store_true",
        help="Validate every docs/assessments/latest_*.md file with the canonical 50-weight model.",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    violations: list[str] = []

    if args.all_latest:
        pattern = str(repo_root / "docs" / "assessments" / "latest_*.md")
        paths = sorted(Path(p) for p in glob.glob(pattern))
        if not paths:
            print("No latest_*.md assessment files found.", file=sys.stderr)
            return 1

        checked = 0
        for path in paths:
            file_violations = _check_file(path)
            if not file_violations:
                continue

            checked += 1
            violations.extend(file_violations)

        if checked == 0:
            print("No canonical 50-weight assessment files found to validate.")
            return 0
    else:
        path = Path(args.assessment_path)
        if not path.is_absolute():
            path = repo_root / path

        violations.extend(_check_file(path))

    if violations:
        for violation in violations:
            print(f"::error::{violation}", file=sys.stderr)
        return 1

    print("Assessment scores are consistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
