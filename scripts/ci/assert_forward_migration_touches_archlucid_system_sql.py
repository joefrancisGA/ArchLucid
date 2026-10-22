#!/usr/bin/env python3
r"""
Merge-blocking discipline: when a forward DbUp script under Migrations/System/ changes,
ArchLucid.Persistence/Scripts/ArchLucid.System.sql must change in the same diff so
system-catalog greenfield / SqlSchemaBootstrapper stays in parity (TB-064).

See docs/library/SQL_SCRIPTS.md §5 (change checklist).

Environment (optional; overrides CLI flags):
  ARCHLUCID_GIT_REPO_ROOT — repo root (default: inferred from script location)
  ARCHLUCID_GIT_DIFF_RANGE — literal range passed to `git diff`, e.g. `main...HEAD`

Local example:
  python scripts/ci/assert_forward_migration_touches_archlucid_system_sql.py \
      --diff-range "origin/main...HEAD"
Exit: 0 = OK or skipped. 1 = forward system migration changed without ArchLucid.System.sql.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


ARCHLUCID_SYSTEM_SQL_PATH = "ArchLucid.Persistence/Scripts/ArchLucid.System.sql"
FORWARD_SYSTEM_MIGRATION_PATTERN = re.compile(
    r"^ArchLucid\.Persistence/Migrations/System/\d{3}_[A-Za-z0-9_]+\.sql$"
)


def _repo_root() -> Path:
    env_root = os.environ.get("ARCHLUCID_GIT_REPO_ROOT", "").strip()

    if env_root:
        return Path(env_root).resolve()

    return Path(__file__).resolve().parents[2]


def normalize_git_path(path: str) -> str:
    return path.strip().replace("\\", "/")


def is_forward_system_migration_path(path: str) -> bool:
    return bool(FORWARD_SYSTEM_MIGRATION_PATTERN.match(normalize_git_path(path)))


def evaluate_changed_paths(changed_paths: list[str]) -> tuple[int, str]:
    normalized = {normalize_git_path(p) for p in changed_paths if p.strip()}
    forwards = sorted(p for p in normalized if is_forward_system_migration_path(p))

    if not forwards:
        return 0, "OK: no forward system-plane DbUp migration files in diff (discipline check skipped)."

    if ARCHLUCID_SYSTEM_SQL_PATH in normalized:
        joined = ", ".join(forwards)

        return 0, f"OK: {ARCHLUCID_SYSTEM_SQL_PATH} updated together with: {joined}"

    joined = ", ".join(forwards)

    return (
        1,
        "Forward system-plane DbUp migration(s) changed without updating consolidated DDL.\n"
        f"  Migrations in diff: {joined}\n"
        f"  Expected: {ARCHLUCID_SYSTEM_SQL_PATH} in the same change set (greenfield parity).\n"
        "  See docs/library/SQL_SCRIPTS.md §5 — change checklist.",
    )


def _git_diff_name_only(repo: Path, diff_range: str) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(repo), "diff", "--name-only", diff_range],
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        print(
            f"git diff failed (rc={result.returncode}): {result.stderr.strip() or result.stdout.strip()}",
            file=sys.stderr,
        )
        raise RuntimeError("git diff failed")

    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _is_empty_github_push_before(before_sha: str) -> bool:
    cleaned = before_sha.strip().lower()

    return cleaned == "" or set(cleaned) <= {"0"}


def _should_skip_push_range(diff_range: str) -> bool:
    if "..." not in diff_range:
        return False

    before = diff_range.split("...", 1)[0].strip()

    return _is_empty_github_push_before(before)


def _resolve_diff_range_from_env_and_args(args: argparse.Namespace) -> str | None:
    literal = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if literal:

        if _should_skip_push_range(literal):
            return None

        return literal

    if args.diff_range:
        return args.diff_range.strip()

    return None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--diff-range",
        help="Passed to git diff --name-only, e.g. origin/main...HEAD",
    )

    args = parser.parse_args(argv)
    repo = _repo_root()

    diff_range = _resolve_diff_range_from_env_and_args(args)
    ci_range_hint = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if diff_range is None:

        if ci_range_hint and _should_skip_push_range(ci_range_hint):
            print(
                "Skipping ArchLucid.System.sql co-touch guard: GitHub push with no meaningful before SHA.",
            )

            return 0

        print(
            "Skipping ArchLucid.System.sql co-touch guard: "
            "set --diff-range or ARCHLUCID_GIT_DIFF_RANGE.",
        )

        return 0

    try:
        paths = _git_diff_name_only(repo, diff_range)
    except RuntimeError:

        return 2

    code, message = evaluate_changed_paths(paths)
    stream = sys.stderr if code != 0 else sys.stdout

    print(message, file=stream)

    return code


if __name__ == "__main__":
    raise SystemExit(main())
