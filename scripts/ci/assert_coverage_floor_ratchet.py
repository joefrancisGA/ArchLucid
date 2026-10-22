#!/usr/bin/env python3
"""
Merged-line coverage ratchet versus a committed baseline in ``.coverage-floor``.

CI passes when merged root line %% is **>= baseline - slack** (default slack 2 %%).
Updating the baseline is an explicit bump to raise the acceptable minimum when coverage improves.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from coverage_cobertura import parse_cobertura


def _read_floor(path: Path) -> float | None:
    """Return the first float token on the first non-comment line in ``path``."""
    if not path.is_file():
        print(f"::error::coverage floor file missing: {path}", file=sys.stderr)
        return None

    raw = path.read_text(encoding="utf-8", errors="replace")
    for raw_line in raw.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        if "#" in line:
            line = line.split("#", 1)[0].strip()

        if not line:
            continue

        try:
            return float(line.split()[0])
        except (ValueError, IndexError):
            print(f"::error::coverage floor parse error in {path}: {raw_line!r}", file=sys.stderr)
            return None

    print(f"::error::no numeric baseline in coverage floor file: {path}", file=sys.stderr)
    return None


def _main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Fail when merged Cobertura root line %% is below (floor-from-file - slack)."
        ),
    )
    parser.add_argument(
        "cobertura",
        type=Path,
        help="Merged Cobertura.xml (same as assert_merged_line_coverage_min.py).",
    )
    parser.add_argument(
        "--floor-file",
        type=Path,
        default=Path(".coverage-floor"),
        help="Path to committed baseline %% (single number per README; default ./.coverage-floor).",
    )
    parser.add_argument(
        "--slack-pct",
        type=float,
        default=2.0,
        help="Allow coverage to sit this far below baseline before failing (default 2).",
    )
    args = parser.parse_args(argv)

    baseline = _read_floor(args.floor_file)
    if baseline is None:
        return 2

    summary = parse_cobertura(args.cobertura)
    if summary is None:
        print(f"::error::could not parse Cobertura {args.cobertura}", file=sys.stderr)
        return 2

    if summary.root_line_pct is None:
        print(f"::error::missing root line-rate in {args.cobertura}", file=sys.stderr)
        return 2

    threshold = baseline - args.slack_pct
    pct = summary.root_line_pct

    if pct + 1e-9 < threshold:
        print(
            "::error::Coverage floor ratchet failed: merged line %.2f%% < baseline %.2f%% − %.2f%% = %.2f%% "
            "(raise tests or bump %s deliberately)."
            % (pct, baseline, args.slack_pct, threshold, args.floor_file),
        )
        return 1

    print(
        "Coverage floor ratchet OK: merged line %.2f%% >= %.2f%% (baseline %.2f%% stored in %s; slack %.2f%%)."
        % (pct, threshold, baseline, args.floor_file, args.slack_pct),
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
