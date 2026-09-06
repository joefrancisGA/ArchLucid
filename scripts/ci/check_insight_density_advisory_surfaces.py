#!/usr/bin/env python3
"""ID-11 / WK-15: insight-density measurement surfaces must state advisory-only claimBoundary."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_REQUIRED_MARKERS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "docs/quality/insight-density-engine-distribution.md",
        ("claimBoundary:", "typed-engine-protected"),
    ),
    (
        "docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md",
        ("typed-engine-protected", "filter cannot raise density"),
    ),
    (
        "docs/library/AGENT_EVAL_CORPUS.md",
        ("claimBoundary:", "typed-engine-protected"),
    ),
    (
        "docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md",
        ("advisory", "typed-engine-protected"),
    ),
    (
        "docs/library/CONFIGURATION_REFERENCE.md",
        ("DemotionThreshold", "typed-engine-protected", "advisory"),
    ),
    (
        "docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md",
        ("typed-engine-protected", "advisory"),
    ),
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    for rel_path, markers in _REQUIRED_MARKERS:
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing density advisory surface: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace").lower()

        for marker in markers:
            if marker.lower() not in text:
                errors.append(f"{rel_path}: missing marker {marker!r}")

    calculator = root / "ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs"

    if not calculator.is_file():
        errors.append("missing InsightDensityEngineDistributionMarkdown.cs")
    else:
        calc_text = calculator.read_text(encoding="utf-8", errors="replace")

        if "ClaimBoundaryMarker" not in calc_text:
            errors.append("InsightDensityEngineDistributionMarkdown.cs: missing ClaimBoundaryMarker")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_insight_density_advisory_surfaces: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
