#!/usr/bin/env python3
"""TB-2231: fail closed when golden-cohort nightly eval shows consecutive drift."""

from __future__ import annotations

import argparse
import importlib.util
import subprocess
import sys
from pathlib import Path
from typing import Any, Mapping


def _load_module(name: str, relative_path: str):
    path = Path(__file__).resolve().parent / relative_path
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def _baseline_alerts_from_pair(current: Mapping[str, Any], previous: Mapping[str, Any]) -> list[str]:
    consecutive = _load_module(
        "assert_real_mode_eval_consecutive_regression",
        "assert_real_mode_eval_consecutive_regression.py",
    )

    return consecutive.check_consecutive_regression(current, previous)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Golden-cohort canary drift alert (TB-2231). "
            "Scores committed exemplars offline; does not call production AOAI (TB-1506)."
        ),
    )
    parser.add_argument("--current", type=Path, required=True, help="Tonight's trend.json path.")
    parser.add_argument(
        "--previous",
        type=Path,
        default=None,
        help="Optional prior-night trend.json (cache); enables two-night baseline drift alert.",
    )
    parser.add_argument(
        "--history-root",
        type=Path,
        default=Path("artifacts/real-mode-eval-nightly"),
        help="Root containing YYYY-MM-DD/trend.json history for three-night mean drift.",
    )
    args = parser.parse_args()

    current_path = args.current.resolve()

    if not current_path.is_file():
        print(f"::error::Missing current trend artifact: {current_path}", file=sys.stderr)
        return 1

    alerts: list[str] = []

    if args.previous is not None and args.previous.is_file():
        consecutive = _load_module(
            "assert_real_mode_eval_consecutive_regression",
            "assert_real_mode_eval_consecutive_regression.py",
        )
        current = consecutive._load_trend(current_path)
        previous = consecutive._load_trend(args.previous.resolve())
        alerts.extend(_baseline_alerts_from_pair(current, previous))

    regression = _load_module(
        "assert_real_mode_eval_regression_trend",
        "assert_real_mode_eval_regression_trend.py",
    )
    alerts.extend(regression.collect_drift_alerts(current_path, args.history_root.resolve()))

    if not alerts:
        print("Golden cohort canary drift alert: no consecutive regression detected.")
        return 0

    for alert in alerts:
        print(f"::error::{alert}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
