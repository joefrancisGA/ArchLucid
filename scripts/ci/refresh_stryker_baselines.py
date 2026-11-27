#!/usr/bin/env python3
"""
Run Stryker.NET for each matrix target, read mutation-report.json, and rewrite
scripts/ci/stryker-baselines.json with floored one-decimal scores plus _measuredDate.

Requires: repo root, `dotnet tool restore`, and pinned `dotnet-stryker` (see .config/dotnet-tools.json).

Usage (from repository root):
  dotnet tool restore
  python3 scripts/ci/refresh_stryker_baselines.py

Subset + merge (keep other labels from the current baseline file):
  python3 scripts/ci/refresh_stryker_baselines.py --only Decisioning --merge-existing
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory

from stryker_evidence import RECEIPT, digest, head_revision, percent, pinned_config, read_json, report_path, run_and_stamp, validate_run
from stryker_pr_plan import FULL_MATRIX

STRYKER_TARGETS = FULL_MATRIX


def _floor_one_decimal(score: float) -> float:
    return math.floor(score * 10 + 1e-9) / 10


def _score_from_output(root: Path, repo: Path, head: str, label: str, config: str) -> float:
    raw_config, project = pinned_config(repo, head, config)
    receipt = read_json((root / RECEIPT).read_bytes())
    evidence = validate_run(report_path(root), receipt, head=head, target=label,
                            config_sha=digest(raw_config), project_dir=project)
    if evidence["status"] != "scored":
        raise ValueError("cannot refresh a baseline from an unscored run")
    return evidence["official_score_percent"]


def _main() -> int:
    parser = argparse.ArgumentParser(description="Refresh Stryker mutation score baselines from local runs.")
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Repository root (default: current directory).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("scripts/ci/stryker-baselines.json"),
        help="Baseline JSON path relative to repo root unless absolute.",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        metavar="LABEL",
        help="Run only this matrix label (repeatable). Default: all matrix targets (see STRYKER_TARGETS).",
    )
    parser.add_argument(
        "--merge-existing",
        action="store_true",
        help="With --only, copy mutationScore entries for labels not run from the existing baseline file.",
    )
    parser.add_argument(
        "--skip-restore",
        action="store_true",
        help="Skip `dotnet tool restore` (use when tools are already restored).",
    )
    parser.add_argument(
        "--skip-stryker",
        action="store_true",
        help="Read one explicitly selected, previously verified run instead of executing Stryker.",
    )
    parser.add_argument("--run-root", type=Path, help="Exactly one prior run directory for --skip-stryker")
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    output_path = args.output if args.output.is_absolute() else (repo_root / args.output)

    only_set = {x.strip() for x in args.only if x.strip()}
    if only_set:
        unknown = only_set - {label for label, _ in STRYKER_TARGETS}
        if unknown:
            print(f"Unknown --only label(s): {sorted(unknown)}", file=sys.stderr)
            return 2
        targets = [(label, cfg) for label, cfg in STRYKER_TARGETS if label in only_set]
    else:
        targets = list(STRYKER_TARGETS)

    if args.merge_existing and not only_set:
        print("--merge-existing requires at least one --only LABEL.", file=sys.stderr)
        return 2

    if only_set and not args.merge_existing:
        print(
            "Use --merge-existing when passing --only (CI baselines must list every STRYKER_TARGETS label).",
            file=sys.stderr,
        )
        return 2

    if args.skip_stryker != (args.run_root is not None) or (args.skip_stryker and len(targets) != 1):
        parser.error("--skip-stryker needs one --only target and an explicit --run-root")
    if not args.skip_restore and not args.skip_stryker:
        print("+ dotnet tool restore", flush=True)
        subprocess.run(["dotnet", "tool", "restore"], cwd=repo_root, check=True)

    head = head_revision(repo_root)
    measured: dict[str, dict[str, float]] = {}

    if args.merge_existing:
        if not output_path.is_file():
            print(f"--merge-existing requires existing baseline at {output_path}", file=sys.stderr)
            return 2
        prior = json.loads(output_path.read_text(encoding="utf-8"))
        for label, _ in STRYKER_TARGETS:
            entry = prior.get(label)
            if isinstance(entry, dict):
                measured[label] = {"mutationScore": percent(entry.get("mutationScore"))}

    for label, config_file in targets:
        print(f"\n=== {label} ({config_file}) ===", flush=True)
        if args.skip_stryker:
            score = _score_from_output(args.run_root, repo_root, head, label, config_file)
        else:
            with TemporaryDirectory(prefix="stryker-baseline-") as work:
                run = Path(work) / label
                run_and_stamp(repo_root, run, head=head, target=label, config=config_file, solution="ArchLucid.sln")
                score = _score_from_output(run, repo_root, head, label, config_file)
        measured[label] = {"mutationScore": _floor_one_decimal(score)}

    missing = [label for label, _ in STRYKER_TARGETS if label not in measured]
    if missing:
        print(f"Missing scores for label(s): {missing}. Use full run or --merge-existing with a complete prior file.", file=sys.stderr)
        return 2

    out_doc: dict[str, object] = {"_measuredDate": date.today().isoformat()}
    for label, _ in STRYKER_TARGETS:
        out_doc[label] = measured[label]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(out_doc, indent=2, sort_keys=False) + "\n"
    output_path.write_text(text, encoding="utf-8", newline="\n")
    print(f"\nWrote {output_path} ({out_doc['_measuredDate']}).", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(_main())
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"Baseline not refreshed: {exc}", file=sys.stderr)
        raise SystemExit(2) from None
