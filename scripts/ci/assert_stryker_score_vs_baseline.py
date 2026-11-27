#!/usr/bin/env python3
"""Compare a verified Stryker.NET run to an unchanged committed baseline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import subprocess
import sys

from stryker_evidence import RECEIPT, digest, head_revision, percent, pinned_config, read_json, report_path, validate_run
from stryker_pr_plan import FULL_MATRIX


def _main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--label", required=True)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--stryker-root", type=Path, default=Path("StrykerOutput"))
    parser.add_argument("--head", help="Expected full checkout SHA (default: HEAD)")
    parser.add_argument("--config", help="Pinned JSON config (defaults to the matrix config for --label)")
    parser.add_argument("--base", help="Exact differential base revision")
    parser.add_argument("--tolerance", type=float, default=0.15)
    parser.add_argument("--allow-zero-denominator", action="store_true",
                        help="Allow verified no-scope output only with an explicit --base")
    args = parser.parse_args(argv)
    try:
        tolerance = percent(args.tolerance)
        if args.allow_zero_denominator and args.base is None:
            raise ValueError("verified no-scope handling requires the exact differential --base")
        config = args.config or dict(FULL_MATRIX).get(args.label)
        if config is None:
            raise ValueError("target is missing a pinned configuration")
        baseline = read_json(args.baseline.read_bytes()).get(args.label)
        if not isinstance(baseline, dict):
            raise ValueError("target is missing a committed baseline")
        floor = percent(baseline.get("mutationScore")) - tolerance
        head = args.head or head_revision(args.repo_root)
        if head_revision(args.repo_root) != head:
            raise ValueError("score check did not run at its expected checkout")
        raw_config, project = pinned_config(args.repo_root, head, config)
        run = read_json((args.stryker_root / RECEIPT).read_bytes())
        result = validate_run(report_path(args.stryker_root), run, head=head, target=args.label,
                              config_sha=digest(raw_config), project_dir=project, base=args.base)
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"Mutation evidence not verified: {exc}", file=sys.stderr)
        return 2

    print(json.dumps({k: v for k, v in result.items() if k != "survivor_candidates"}, indent=2))
    if result["status"] == "no-in-scope-mutants":
        if not args.allow_zero_denominator:
            print("No score is available for this verified differential scope.", file=sys.stderr)
            return 2
        print("NOT SCORED: verified differential with no in-scope mutants; no baseline comparison.")
        return 0
    score = result["official_score_percent"]
    if score + 1e-9 < floor:
        print(f"REGRESSION: official score {score:.2f}% is below the baseline floor {floor:.2f}%.", file=sys.stderr)
        return 1
    print(f"OK: official score {score:.2f}% meets the baseline floor {floor:.2f}%.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
