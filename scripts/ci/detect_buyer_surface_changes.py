#!/usr/bin/env python3
"""Detect whether a git diff touches buyer-facing claim or marketing surfaces."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

BUYER_SURFACE_PREFIXES: tuple[str, ...] = (
    "docs/go-to-market/",
    "docs/BUYER_FIRST_30_MINUTES.md",
    "docs/library/V1_SCOPE.md",
    "archlucid-ui/src/app/(marketing)/",
    "archlucid-ui/src/lib/vocabulary/buyer-surface-vocabulary.ts",
    "archlucid-ui/src/lib/marketing-",
    "templates/briefs/",
)

BUYER_SURFACE_EXACT_FILES: frozenset[str] = frozenset(
    {
        "docs/go-to-market/trust-center.md",
        "docs/go-to-market/PRICING_PHILOSOPHY.md",
        "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
        "docs/go-to-market/QUOTE_TO_PROOF_PACKET.md",
    }
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
    except OSError:
        return []

    if completed.returncode != 0:
        return []

    return [line.strip().replace("\\", "/") for line in completed.stdout.splitlines() if line.strip()]


def path_matches_buyer_surface(path: str) -> bool:
    normalized = path.replace("\\", "/")

    if normalized in BUYER_SURFACE_EXACT_FILES:
        return True

    for prefix in BUYER_SURFACE_PREFIXES:
        if normalized.startswith(prefix) or normalized == prefix.rstrip("/"):
            return True

    return False


def detect_buyer_surface_changes(base_ref: str, root: Path | None = None) -> dict[str, object]:
    root_path = root or repo_root()
    changed = git_diff_name_only(base_ref, root_path)
    matched = sorted({path for path in changed if path_matches_buyer_surface(path)})

    return {
        "schema": "archlucid.buyer-surface-change-detection.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "baseRef": base_ref,
        "buyerSurfaceChanged": len(matched) > 0,
        "changedPaths": matched,
    }


def write_github_output(payload: dict[str, object], output_path: Path | None) -> None:
    path = output_path

    if path is None:
        output_path_env = os.environ.get("GITHUB_OUTPUT", "").strip()
        path = Path(output_path_env) if output_path_env else None

    if path is None or not path.parent.exists():
        return

    changed = "true" if payload.get("buyerSurfaceChanged") else "false"
    lines = [
        f"changed={changed}",
        f"changed_count={len(payload.get('changedPaths', []))}",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-ref",
        default="origin/main",
        help="Git base ref for comparison (default: origin/main).",
    )
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument(
        "--write-github-output",
        action="store_true",
        help="Write changed=true/false to GITHUB_OUTPUT when present.",
    )
    args = parser.parse_args(argv)

    payload = detect_buyer_surface_changes(args.base_ref)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if args.write_github_output:
        write_github_output(payload, None)

    if payload["buyerSurfaceChanged"]:
        print(
            f"buyer-surface: changed ({len(payload['changedPaths'])} path(s)) — strict claim guards apply"
        )

        for path in payload["changedPaths"]:
            print(f"  - {path}")

        return 0

    print("buyer-surface: unchanged vs base ref — claim guards remain advisory")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
