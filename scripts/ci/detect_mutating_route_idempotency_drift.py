#!/usr/bin/env python3
"""Fail CI when new mutating routes lack idempotency posture (baseline drift guard)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from check_mutating_route_idempotency_posture import evaluate, repo_root  # noqa: E402


def route_key(verb: str, path: str) -> str:
    return f"{verb.upper()} {path}"


def load_baseline(path: Path) -> dict[str, str]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    routes = payload.get("routes")

    if not isinstance(routes, dict):
        raise ValueError(f"{path}: 'routes' must be an object")

    return {str(k): str(v) for k, v in routes.items()}


def detect_drift(*, current: dict[str, object], baseline: dict[str, str]) -> list[str]:
    errors: list[str] = []
    routes = current.get("routes")

    if not isinstance(routes, list):
        raise ValueError("evaluate() did not return routes list")

    current_map: dict[str, str] = {}

    for row in routes:
        if not isinstance(row, dict):
            continue

        key = route_key(str(row["verb"]), str(row["path"]))
        current_map[key] = str(row["posture"])

    for key, posture in current_map.items():
        if posture != "unclassified":
            continue

        if key not in baseline:
            errors.append(f"new unclassified route: {key}")

        elif baseline[key] != "unclassified":
            errors.append(f"regressed to unclassified: {key} (was {baseline[key]})")

    return errors


def write_baseline(path: Path, summary: dict[str, object]) -> None:
    routes = summary.get("routes")

    if not isinstance(routes, list):
        raise ValueError("routes missing from summary")

    mapping = {
        route_key(str(row["verb"]), str(row["path"])): str(row["posture"])
        for row in routes
        if isinstance(row, dict)
    }

    payload = {
        "formatVersion": "1.0",
        "discoveredRouteCount": summary.get("discoveredRouteCount"),
        "unclassifiedRouteCount": summary.get("unclassifiedRouteCount"),
        "routes": mapping,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument(
        "--baseline",
        type=Path,
        default=None,
        help="Baseline JSON (default: scripts/ci/fixtures/mutating_route_idempotency_baseline.json).",
    )
    parser.add_argument(
        "--write-baseline",
        action="store_true",
        help="Refresh the committed baseline from the current controller surface (maintainer only).",
    )
    args = parser.parse_args(argv)

    root = args.repo_root.resolve()
    baseline_path = (
        args.baseline
        if args.baseline is not None
        else root / "scripts" / "ci" / "fixtures" / "mutating_route_idempotency_baseline.json"
    )
    summary = evaluate(root)

    if args.write_baseline:
        write_baseline(baseline_path, summary)
        print(f"wrote baseline: {baseline_path} ({summary.get('unclassifiedRouteCount')} unclassified)")
        return 0

    if not baseline_path.is_file():
        print(f"detect_mutating_route_idempotency_drift: missing {baseline_path}", file=sys.stderr)
        return 2

    errors = detect_drift(current=summary, baseline=load_baseline(baseline_path))

    if errors:
        print("detect_mutating_route_idempotency_drift: FAILED", file=sys.stderr)

        for line in errors:
            print(f"  - {line}", file=sys.stderr)

        return 1

    print(
        "detect_mutating_route_idempotency_drift: OK "
        f"({summary.get('discoveredRouteCount')} routes; "
        f"{summary.get('unclassifiedRouteCount')} grandfathered unclassified)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
