#!/usr/bin/env python3
"""Two-inspector capture-recapture estimate for residual defect exploration."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def estimate(first: set[str], second: set[str]) -> dict:
    n1 = len(first)
    n2 = len(second)
    overlap = len(first & second)
    union = len(first | second)
    chapman = ((n1 + 1) * (n2 + 1) / (overlap + 1)) - 1
    estimated_unseen = max(0.0, chapman - union)

    warnings = []
    if overlap == 0:
        warnings.append("zero overlap makes the estimate highly unstable")
    if min(n1, n2) < 5:
        warnings.append("small capture sets make the estimate highly uncertain")
    warnings.append("capture-recapture assumes sufficiently independent inspectors and roughly equal catchability; software defects violate these assumptions")

    return {
        "schemaVersion": 1,
        "firstCount": n1,
        "secondCount": n2,
        "overlapCount": overlap,
        "observedUnionCount": union,
        "chapmanEstimatedTotal": round(chapman, 3),
        "estimatedUnseen": round(estimated_unseen, 3),
        "warnings": warnings,
        "claimBoundary": "Exploratory residual-risk signal only; never a correctness probability.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("first", type=Path)
    parser.add_argument("second", type=Path)
    args = parser.parse_args(argv)
    first = set(json.loads(args.first.read_text(encoding="utf-8")))
    second = set(json.loads(args.second.read_text(encoding="utf-8")))
    print(json.dumps(estimate(first, second), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
