#!/usr/bin/env python3
"""
Merge-blocking guard: when ManifestHashService.cs changes, the PR must also update
the committed hasher baseline artifact (or set ARCHLUCID_MANIFEST_HASH_BASELINE_LOCK_APPROVED).

Pairs docs/library/MANIFEST_HASH_HASHER_BASELINE.md (TB-1157).
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SERVICE_REL = "ArchLucid.Decisioning/Services/ManifestHashService.cs"
BASELINE_JSON_REL = "tests/manifest-hash/hasher-baseline-v1.json"
BASELINE_DOC_REL = "docs/library/MANIFEST_HASH_HASHER_BASELINE.md"

_BASELINE_JSON_PATTERN = re.compile(
    r"^tests/manifest-hash/hasher-baseline-v\d+\.json$"
)


def _is_truthy(raw: str | None) -> bool:
    if raw is None:
        return False

    v = raw.strip()

    if not v:
        return False

    return v.lower() in ("1", "true", "yes")


def normalize_git_path(path: str) -> str:
    return path.strip().replace("\\", "/")


def git_diff_name_only(diff_range: str, repo_root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", diff_range],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(f"git diff --name-only {diff_range!r} failed: {detail}")

    return [line for line in result.stdout.splitlines() if line.strip()]


def evaluate_changed_paths(changed_paths: list[str]) -> tuple[int, str]:
    normalized = {normalize_git_path(p) for p in changed_paths if p.strip()}

    if SERVICE_REL not in normalized:
        return 0, f"OK: {SERVICE_REL} not in diff (guard skipped)."

    if _is_truthy(os.environ.get("ARCHLUCID_MANIFEST_HASH_BASELINE_LOCK_APPROVED")):
        return 0, "OK: ARCHLUCID_MANIFEST_HASH_BASELINE_LOCK_APPROVED is set."

    baseline_touched = any(
        p == BASELINE_JSON_REL
        or p == BASELINE_DOC_REL
        or _BASELINE_JSON_PATTERN.match(p)
        for p in normalized
    )

    if baseline_touched:
        return 0, "OK: hasher baseline artifact updated together with ManifestHashService."

    return (
        1,
        f"{SERVICE_REL} changed without updating hasher baseline artifacts.\n"
        f"  Update {BASELINE_JSON_REL} and {BASELINE_DOC_REL} in the same commit,\n"
        "  or set ARCHLUCID_MANIFEST_HASH_BASELINE_LOCK_APPROVED=true after owner approval.\n"
        "  See docs/library/MANIFEST_HASH_HASHER_BASELINE.md.",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--diff-range",
        default=os.environ.get("ARCHLUCID_GIT_DIFF_RANGE", "").strip() or None,
        help="Range for git diff --name-only (e.g. origin/main...HEAD)",
    )
    parser.add_argument(
        "--paths",
        nargs="*",
        help="Optional explicit changed paths (skips git); for unit tests.",
    )
    args = parser.parse_args()

    if args.paths is not None:
        changed = list(args.paths)
    else:
        diff_range = args.diff_range

        if not diff_range:
            return 0

        changed = git_diff_name_only(diff_range, REPO_ROOT)

    code, message = evaluate_changed_paths(changed)

    if code != 0:
        print(f"error: {message}", file=sys.stderr)
    else:
        print(message)

    return code


if __name__ == "__main__":
    raise SystemExit(main())
