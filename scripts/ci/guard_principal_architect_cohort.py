#!/usr/bin/env python3
"""CI guard for principal-architect cohort evidence — warn-only on insufficient sample."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from principal_architect_cohort_core import (
    build_cohort_report,
    load_normalized_sessions,
    load_thresholds,
)

_REPO = Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    thresholds = load_thresholds()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--principal-dir",
        type=Path,
        default=_REPO / str(thresholds.get("principalArchitectSessionsRoot") or "artifacts/principal-architect-sessions"),
    )
    parser.add_argument(
        "--blind-dir",
        type=Path,
        default=_REPO / str(thresholds.get("blindValidationSessionsRoot") or "artifacts/blind-validation"),
    )
    parser.add_argument(
        "--report-json",
        type=Path,
        default=_REPO / str(thresholds.get("reportOutputRoot") or "artifacts/principal-architect-cohort") / "cohort-report.json",
        help="Optional precomputed report; when missing the guard runs the batch inline.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 when disposition is FAIL and messagingReady is true (local use only).",
    )
    args = parser.parse_args(argv)

    if args.report_json.is_file():
        report = json.loads(args.report_json.read_text(encoding="utf-8"))
    else:
        sessions = load_normalized_sessions(
            args.principal_dir,
            args.blind_dir,
            list(thresholds.get("archlucidSourceKeys") or ["archlucid"]),
        )
        report = build_cohort_report(sessions, thresholds)

    disposition = str(report.get("disposition") or "UNKNOWN")
    session_count = int(report.get("sessionCount") or 0)
    min_sessions = int(report.get("minSessionsForEvaluation") or 3)
    messaging_ready = bool(report.get("messagingReady"))

    if disposition == "INSUFFICIENT_EVIDENCE":
        print(
            f"WARNING: principal-architect cohort has insufficient evidence "
            f"({session_count} session(s); require >= {min_sessions}).",
            file=sys.stderr,
        )
        return 0

    print(
        f"Principal-architect cohort guard: disposition={disposition}, sessions={session_count}.",
        file=sys.stderr,
    )

    if args.strict and messaging_ready and disposition == "FAIL":
        print("ERROR: cohort thresholds failed under --strict.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
