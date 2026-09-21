#!/usr/bin/env python3
"""Warn when the private-beta frozen smoke pin is not on the current RC34 line."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

PIN_RELATIVE_PATH = Path("scripts/ci/private_beta_frozen_branch.sha")
RC34_REF = "origin/RC34"


def repository_root() -> Path:
    return Path(__file__).resolve().parents[2]


def read_pinned_sha(pin_path: Path) -> str | None:
    match = re.search(r"^pinned_sha=([0-9a-fA-F]{7,40})$", pin_path.read_text(encoding="utf-8"), re.MULTILINE)

    return None if match is None else match.group(1)


def git_ref_exists(root: Path, ref: str) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--verify", ref],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )

    return result.returncode == 0


def is_ancestor(root: Path, ancestor: str, ref: str) -> bool:
    result = subprocess.run(
        ["git", "merge-base", "--is-ancestor", ancestor, ref],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )

    return result.returncode == 0


def main() -> int:
    root = repository_root()
    pin_path = root / PIN_RELATIVE_PATH

    if not pin_path.is_file():
        print(f"::warning::{PIN_RELATIVE_PATH} is missing; frozen-branch freshness was not checked")

        return 0

    pinned_sha = read_pinned_sha(pin_path)

    if pinned_sha is None:
        print(f"::warning::{PIN_RELATIVE_PATH} has no valid pinned_sha; frozen-branch freshness was not checked")

        return 0

    if not git_ref_exists(root, RC34_REF):
        print(f"::notice::{RC34_REF} is unavailable; frozen-branch freshness was not checked")

        return 0

    if not is_ancestor(root, pinned_sha, RC34_REF):
        print(
            f"::warning::private-beta frozen pin {pinned_sha} is not an ancestor of {RC34_REF}; "
            "refresh only after the current frozen smoke finishes",
        )

        return 0

    print(f"Frozen private-beta pin {pinned_sha} is an ancestor of {RC34_REF}.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
