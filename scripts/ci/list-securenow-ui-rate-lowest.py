#!/usr/bin/env python3
"""List the lowest scored SecureNow routes in the owner workbook."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="List lowest UX-scored SecureNow operator/help routes.",
    )
    parser.add_argument("--limit", type=int, default=20, help="How many routes to return.")
    return parser


def load_routes() -> list[dict[str, str]]:
    output = subprocess.check_output(
        [sys.executable, str(REPO / "scripts/ci/list-securenow-ui-rate-routes.py"), "--json"],
        text=True,
    )
    return json.loads(output)


def load_workbook_scores() -> dict[str, tuple[str, int, int]]:
    output = subprocess.check_output(
        [sys.executable, str(REPO / "scripts/ci/securenow-ui-rate-workbook-lookup.py")],
        text=True,
    )
    scores: dict[str, tuple[str, int, int]] = {}
    row_pattern = re.compile(r"^\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|$")

    for line in output.splitlines()[2:]:
        match = row_pattern.match(line.strip())

        if match is None:
            continue

        scores[match.group(1)] = (
            match.group(2).strip(),
            int(match.group(3)),
            int(match.group(4)),
        )

    return scores


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.limit < 1:
        print("limit must be at least 1", file=sys.stderr)
        return 2

    scores = load_workbook_scores()
    scored_routes = [
        (route["href"], *scores[route["href"]])
        for route in load_routes()
        if route["href"] in scores and scores[route["href"]][1] > 0
    ]
    scored_routes.sort(key=lambda row: (row[2], row[3], row[0]))
    selected = scored_routes[: args.limit]

    print("| Rank | Code | UX | Evidence | Path |")
    print("|------|------|-----|----------|------|")

    for index, (path, code, ux, evidence) in enumerate(selected, start=1):
        print(f"| {index} | {code} | {ux} | {evidence} | `{path}` |")

    print()
    print(
        f"Source: `.local/owner/ui_route_traffic_estimates.md`; "
        f"{len(selected)} of {len(scored_routes)} scored SecureNow routes; "
        "UX score 0 rows are excluded as unscored.",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
