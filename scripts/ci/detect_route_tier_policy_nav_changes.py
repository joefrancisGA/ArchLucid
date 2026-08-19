#!/usr/bin/env python3
"""Detect whether route/tier/policy/nav surfaces changed vs a git base ref."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROUTE_TIER_SURFACE_PREFIXES: tuple[str, ...] = (
    "ArchLucid.Api/Controllers/",
    "archlucid-ui/src/lib/operator-nav",
    "archlucid-ui/src/lib/route-tier",
    "archlucid-ui/src/components/OperatorShellNav",
    "scripts/ci/assert_route_tier_policy_nav.py",
    "scripts/ci/data/route_tier_policy_nav_registry.json",
    "scripts/ci/data/route_tier_policy_nav_overrides.json",
    "scripts/ci/data/route_tier_policy_nav_exemptions.json",
    "docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md",
    "docs/library/PRODUCT_PACKAGING.md",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def git_diff_name_only(base_ref: str, root: Path) -> list[str]:
    try:
        completed = subprocess.run(
            ["git", "diff", "--name-only", f"{base_ref}...HEAD"],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as exc:
        return []

    if completed.returncode != 0:
        return []

    lines = [line.strip().replace("\\", "/") for line in completed.stdout.splitlines() if line.strip()]
    return lines


def path_matches_surface(path: str) -> bool:
    normalized = path.replace("\\", "/")

    for prefix in ROUTE_TIER_SURFACE_PREFIXES:
        if normalized.startswith(prefix) or normalized == prefix.rstrip("/"):
            return True

    return False


def detect_changed_surfaces(base_ref: str, root: Path | None = None) -> dict[str, object]:
    root_path = root or repo_root()
    changed = git_diff_name_only(base_ref, root_path)
    matched = sorted({path for path in changed if path_matches_surface(path)})

    return {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "base_ref": base_ref,
        "surfaces_changed": len(matched) > 0,
        "changed_paths": matched,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-ref",
        default="origin/main",
        help="Git base ref for comparison (default: origin/main).",
    )
    parser.add_argument("--json-out", type=Path, default=None, help="Optional JSON output path.")
    args = parser.parse_args()

    payload = detect_changed_surfaces(args.base_ref)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if payload["surfaces_changed"]:
        print(f"route/tier/policy/nav surfaces changed ({len(payload['changed_paths'])} paths)")
        for path in payload["changed_paths"]:
            print(f"  - {path}")
        return 0

    print("route/tier/policy/nav surfaces unchanged vs base ref")
    return 0


if __name__ == "__main__":
    sys.exit(main())
