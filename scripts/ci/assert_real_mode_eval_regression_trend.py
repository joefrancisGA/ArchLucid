#!/usr/bin/env python3
"""Warn when nightly real-mode eval shows two consecutive regression nights (TB-683)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Mapping


_DATE_DIR = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _load_json(path: Path) -> dict[str, Any]:
    doc = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(doc, dict):
        raise ValueError(f"{path}: trend report must be an object")

    return doc


def _mean_aggregate(doc: Mapping[str, Any]) -> float | None:
    value = doc.get("meanEvaluatedAggregateScore")

    if value is None:
        return None

    return float(value)


def _floor_breached(doc: Mapping[str, Any]) -> bool:
    gate = doc.get("gate")

    if not isinstance(gate, dict):
        return False

    return bool(gate.get("would_fail_exit"))


def _find_previous_trend(current_path: Path, history_root: Path) -> Path | None:
    current_date = current_path.parent.name
    candidates: list[str] = []

    if not history_root.is_dir():
        return None

    for child in history_root.iterdir():
        if not child.is_dir() or not _DATE_DIR.match(child.name):
            continue

        if child.name >= current_date:
            continue

        trend = child / "trend.json"

        if trend.is_file():
            candidates.append(child.name)

    if not candidates:
        return None

    previous_date = sorted(candidates)[-1]

    return history_root / previous_date / "trend.json"


def _find_prior_trend(previous_path: Path, history_root: Path) -> Path | None:
    previous_date = previous_path.parent.name
    candidates: list[str] = []

    for child in history_root.iterdir():
        if not child.is_dir() or not _DATE_DIR.match(child.name):
            continue

        if child.name >= previous_date:
            continue

        trend = child / "trend.json"

        if trend.is_file():
            candidates.append(child.name)

    if not candidates:
        return None

    prior_date = sorted(candidates)[-1]

    return history_root / prior_date / "trend.json"


def main() -> int:
    parser = argparse.ArgumentParser(description="TB-683 consecutive-night regression trend warnings.")
    parser.add_argument("--current", type=Path, required=True, help="Tonight's trend.json path.")
    parser.add_argument(
        "--history-root",
        type=Path,
        default=Path("artifacts/real-mode-eval-nightly"),
        help="Root containing YYYY-MM-DD/trend.json history.",
    )
    args = parser.parse_args()

    current_path = args.current.resolve()
    history_root = args.history_root.resolve()
    current = _load_json(current_path)
    warnings: list[str] = []

    if _floor_breached(current):
        previous_path = _find_previous_trend(current_path, history_root)

        if previous_path is not None:
            previous = _load_json(previous_path)

            if _floor_breached(previous):
                warnings.append(
                    "Two consecutive nightly real-mode eval runs breached enforced floors "
                    f"({previous_path.parent.name} and {current_path.parent.name})."
                )

    current_mean = _mean_aggregate(current)
    previous_path = _find_previous_trend(current_path, history_root)

    if current_mean is not None and previous_path is not None:
        previous = _load_json(previous_path)
        previous_mean = _mean_aggregate(previous)
        prior_path = _find_prior_trend(previous_path, history_root)

        if previous_mean is not None and prior_path is not None:
            prior = _load_json(prior_path)
            prior_mean = _mean_aggregate(prior)

            if (
                prior_mean is not None
                and previous_mean < prior_mean
                and current_mean < previous_mean
            ):
                warnings.append(
                    "Mean evaluated real-mode aggregate score regressed for two consecutive nights "
                    f"({prior_path.parent.name} {prior_mean:.4f} → "
                    f"{previous_path.parent.name} {previous_mean:.4f} → "
                    f"{current_path.parent.name} {current_mean:.4f})."
                )

    for warning in warnings:
        print(f"::warning::{warning}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
