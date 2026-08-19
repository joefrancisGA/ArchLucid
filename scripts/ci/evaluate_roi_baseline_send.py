#!/usr/bin/env python3
"""CLI wrapper for ROI baseline SEND evaluation."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import load_json  # noqa: E402
from roi_baseline_send_policy import evaluate_send_eligibility  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--go-no-go-summary", type=Path, required=True)
    parser.add_argument("--override-json", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--strict-send", action="store_true")
    args = parser.parse_args(argv)

    summary = load_json(args.go_no_go_summary)

    if summary is None:
        raise SystemExit(f"Could not read summary: {args.go_no_go_summary}")

    override = (
        load_json(args.override_json)
        if args.override_json and args.override_json.is_file()
        else None
    )
    evaluation = evaluate_send_eligibility(summary, override)
    evaluation["roiBasisStatus"] = summary.get("roiBasisStatus")
    evaluation["roiSponsorSafe"] = summary.get("roiSponsorSafe")

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(evaluation, indent=2) + "\n", encoding="utf-8")

    print(
        f"ROI baseline SEND evaluation: completeness={evaluation['baselineCompletenessStatus']} "
        f"sendEligible={evaluation['sendEligible']}"
    )

    if args.strict_send and not evaluation["sendEligible"]:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
