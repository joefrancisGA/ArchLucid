#!/usr/bin/env python3
"""TB-683: warn when real-mode eval trend regresses on two consecutive nights."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Mapping


def _load_trend(path: Path) -> dict[str, Any]:
    doc = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(doc, dict):
        raise ValueError(f"{path}: trend artifact must be an object")

    return doc


def _baseline_regressed(trend: Mapping[str, Any]) -> bool:
    gate = trend.get("gateSnapshot")

    if isinstance(gate, dict) and bool(gate.get("baseline_failed")):
        return True

    comparisons = trend.get("baselineComparisons")

    if not isinstance(comparisons, list):
        return False

    return any(isinstance(item, dict) and bool(item.get("failed")) for item in comparisons)


def check_consecutive_regression(
    current: Mapping[str, Any],
    previous: Mapping[str, Any] | None,
) -> list[str]:
    if previous is None:
        return []

    warnings: list[str] = []

    if _baseline_regressed(current) and _baseline_regressed(previous):
        warnings.append(
            "Real-mode eval baseline regression detected on two consecutive nights "
            "(informational; nightly job still fails on floor breach via eval_agent_corpus.py)."
        )

    return warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Warn on two-night real-mode eval regression trends.")
    parser.add_argument("--current", type=Path, required=True, help="Tonight's trend.json path.")
    parser.add_argument(
        "--previous",
        type=Path,
        default=None,
        help="Prior night's trend.json from cache (optional).",
    )
    args = parser.parse_args()

    current_path = args.current.resolve()

    if not current_path.is_file():
        print(f"::error::Missing current trend artifact: {current_path}", file=sys.stderr)
        return 1

    current = _load_trend(current_path)
    previous = _load_trend(args.previous.resolve()) if args.previous and args.previous.is_file() else None

    for warning in check_consecutive_regression(current, previous):
        print(f"::warning::{warning}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
