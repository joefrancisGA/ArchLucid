#!/usr/bin/env python3
"""Run principal-architect and blind-validation cohort batch aggregation."""

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
    render_markdown,
)

_REPO = Path(__file__).resolve().parents[2]


def main(argv: list[str] | None = None) -> int:
    thresholds = load_thresholds()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--principal-dir",
        type=Path,
        default=_REPO / str(thresholds.get("principalArchitectSessionsRoot") or "artifacts/principal-architect-sessions"),
        help="Directory containing principal-architect session.json files.",
    )
    parser.add_argument(
        "--blind-dir",
        type=Path,
        default=_REPO / str(thresholds.get("blindValidationSessionsRoot") or "artifacts/blind-validation"),
        help="Directory containing blind-validation session-summary.json files.",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        default=_REPO / str(thresholds.get("reportOutputRoot") or "artifacts/principal-architect-cohort") / "cohort-report.json",
    )
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument(
        "--thresholds-json",
        type=Path,
        default=None,
        help="Optional override for cohort threshold constants.",
    )
    args = parser.parse_args(argv)

    if args.thresholds_json is not None:
        thresholds = load_thresholds(args.thresholds_json)

    sessions = load_normalized_sessions(
        args.principal_dir,
        args.blind_dir,
        list(thresholds.get("archlucidSourceKeys") or ["archlucid"]),
    )
    report = build_cohort_report(sessions, thresholds)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    markdown_out = args.markdown_out

    if markdown_out is None:
        markdown_out = args.json_out.with_suffix(".md")

    markdown_out.parent.mkdir(parents=True, exist_ok=True)
    markdown_out.write_text(render_markdown(report), encoding="utf-8")

    print(
        "Wrote principal-architect cohort batch report "
        f"({report['sessionCount']} sessions, disposition={report['disposition']}) "
        f"to {args.json_out.resolve()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
