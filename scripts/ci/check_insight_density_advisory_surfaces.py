#!/usr/bin/env python3
"""ID-11 / WK-15 / QR-02: insight-density measurement surfaces must state advisory-only claimBoundary."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_REQUIRED_MARKERS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "docs/quality/insight-density-engine-distribution.md",
        ("claimBoundary:", "typed-engine-scored"),
    ),
    (
        "docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md",
        ("typed-engine-scored", "filter cannot raise density"),
    ),
    (
        "docs/library/AGENT_EVAL_CORPUS.md",
        ("claimBoundary:", "typed-engine-scored"),
    ),
    (
        "docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md",
        ("advisory", "typed-engine-scored"),
    ),
    (
        "docs/library/CONFIGURATION_REFERENCE.md",
        ("DemotionThreshold", "typed-engine-scored", "advisory"),
    ),
    (
        "archlucid-ui/src/lib/quality/insight-density-measurement-floor.ts",
        ("typed-engine-scored", "advisory", "measurement floor"),
    ),
    (
        "docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md",
        ("typed-engine-scored", "advisory"),
    ),
)

_HISTORICAL_PROTECTED_CONTEXT = re.compile(
    r"superseded|legacy|until adr 0070|pre-adr|was forbidden|no longer means|discarded the score",
    re.IGNORECASE,
)

_FORBIDDEN_CURRENT_PROTECTED_CLAIM = re.compile(
    r"typed-engine-protected.*(?:always promote|never demote|not demote|unconditionally|"
    r"short-circuit|claim boundary|remain advisory under the|demotions stay advisory)",
    re.IGNORECASE,
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def collect_required_marker_errors(
    root: Path,
    markers: tuple[tuple[str, tuple[str, ...]], ...] = _REQUIRED_MARKERS,
) -> list[str]:
    errors: list[str] = []

    for rel_path, required in markers:
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing density advisory surface: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        lowered = text.lower()

        for marker in required:
            if marker.lower() not in lowered:
                errors.append(f"{rel_path}: missing marker {marker!r}")

        errors.extend(collect_forbidden_protected_claim_errors(rel_path, text))

    return errors


def collect_forbidden_protected_claim_errors(rel_path: str, text: str) -> list[str]:
    errors: list[str] = []

    for line_no, line in enumerate(text.splitlines(), start=1):
        if "typed-engine-protected" not in line.lower():
            continue

        if _HISTORICAL_PROTECTED_CONTEXT.search(line):
            continue

        if _FORBIDDEN_CURRENT_PROTECTED_CLAIM.search(line):
            errors.append(
                f"{rel_path}:{line_no}: stale current-tense typed-engine-protected production claim",
            )

    return errors


def collect_calculator_errors(root: Path) -> list[str]:
    calculator = root / "ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs"

    if not calculator.is_file():
        return ["missing InsightDensityEngineDistributionMarkdown.cs"]

    calc_text = calculator.read_text(encoding="utf-8", errors="replace")

    if "ClaimBoundaryMarker" not in calc_text:
        return ["InsightDensityEngineDistributionMarkdown.cs: missing ClaimBoundaryMarker"]

    return []


def collect_errors(root: Path | None = None) -> list[str]:
    resolved_root = repo_root() if root is None else root

    errors = collect_required_marker_errors(resolved_root)
    errors.extend(collect_calculator_errors(resolved_root))

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors = collect_errors()

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_insight_density_advisory_surfaces: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
