#!/usr/bin/env python3
"""Detect mutating API controller surface changes vs a git base ref."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SURFACE_PREFIX = "ArchLucid.Api/Controllers/"


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


def detect_changed_controllers(base_ref: str, root: Path | None = None) -> dict[str, object]:
    root_path = root or repo_root()
    changed = git_diff_name_only(base_ref, root_path)
    matched = sorted(
        {
            path
            for path in changed
            if path.startswith(SURFACE_PREFIX) and path.endswith(".cs")
        },
    )

    return {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "base_ref": base_ref,
        "controllers_changed": len(matched) > 0,
        "changed_paths": matched,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-ref", default="origin/main")
    parser.add_argument("--json-out", type=Path, default=None)
    args = parser.parse_args()

    payload = detect_changed_controllers(args.base_ref)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if payload["controllers_changed"]:
        print(f"mutating controller surfaces changed ({len(payload['changed_paths'])} files)")
        return 0

    print("mutating controller surfaces unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main())
