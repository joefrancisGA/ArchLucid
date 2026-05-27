#!/usr/bin/env python3
"""Lint changed forward migrations for rolling-deploy anti-patterns (TB-068)."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MIGRATION_PATH = re.compile(r"^ArchLucid\.Persistence/Migrations/(\d{3})_[A-Za-z0-9_]+\.sql$")

# Allow-list: historical migrations documented in ROLLING_DEPLOY_MIGRATIONS.md
ALLOWLIST = {
    "116",
    "214",
    "215",
    "216",
    "223",
}

ALTER_NOT_NULL = re.compile(
    r"ALTER\s+TABLE\s+.+?\s+ALTER\s+COLUMN\s+.+?\s+NOT\s+NULL",
    re.IGNORECASE | re.DOTALL,
)
DELETE_BEFORE_UNIQUE = re.compile(
    r"DELETE\s+FROM.+?CREATE\s+UNIQUE",
    re.IGNORECASE | re.DOTALL,
)
DROP_INDEX_BEFORE_REPLACEMENT = re.compile(
    r"DROP\s+INDEX.+?CREATE\s+UNIQUE\s+INDEX",
    re.IGNORECASE | re.DOTALL,
)


def _repo_root() -> Path:
    env_root = os.environ.get("ARCHLUCID_GIT_REPO_ROOT", "").strip()

    if env_root:
        return Path(env_root).resolve()

    return ROOT


def _changed_migration_files(base: str, head: str) -> list[Path]:
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...{head}"],
        cwd=_repo_root(),
        check=False,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        return []

    files: list[Path] = []

    for line in result.stdout.splitlines():
        rel = line.strip().replace("\\", "/")

        if MIGRATION_PATH.match(rel):
            files.append(_repo_root() / rel)

    return files


def _migration_number(path: Path) -> str:
    match = re.search(r"/Migrations/(\d{3})_", path.as_posix())

    if match:
        return match.group(1)

    return "000"


def _strip_comments(sql: str) -> str:
    without_blocks = re.sub(r"/\*.*?\*/", "", sql, flags=re.S)
    return re.sub(r"--[^\n]*", "", without_blocks)


def lint_file(path: Path) -> list[str]:
    number = _migration_number(path)

    if number in ALLOWLIST:
        return []

    raw = path.read_text(encoding="utf-8")
    body = _strip_comments(raw)
    issues: list[str] = []

    if ALTER_NOT_NULL.search(body):
        issues.append(
            f"{path.name}: bare ALTER COLUMN … NOT NULL — use expand/contract (nullable add → backfill → NOT NULL)."
        )

    if DELETE_BEFORE_UNIQUE.search(body):
        issues.append(
            f"{path.name}: DELETE before CREATE UNIQUE INDEX — coordinate deploy order; old pods may recreate duplicates."
        )

    if DROP_INDEX_BEFORE_REPLACEMENT.search(body):
        issues.append(
            f"{path.name}: DROP INDEX before replacement UNIQUE — add new index before dropping old uniqueness."
        )

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Rolling-deploy migration pattern linter.")
    parser.add_argument("--diff-base", default=os.environ.get("ARCHLUCID_DIFF_BASE", "HEAD~1"))
    parser.add_argument("--diff-head", default=os.environ.get("ARCHLUCID_DIFF_HEAD", "HEAD"))
    parser.add_argument("--file", action="append", dest="files", help="Lint explicit migration file path.")
    args = parser.parse_args()

    paths: list[Path]

    if args.files:
        paths = [Path(f).resolve() for f in args.files]
    else:
        paths = _changed_migration_files(args.diff_base, args.diff_head)

    if not paths:
        print("No changed forward migrations to lint.")
        return 0

    all_issues: list[str] = []

    for path in paths:
        if not path.is_file():
            continue

        all_issues.extend(lint_file(path))

    if all_issues:
        print("Rolling-deploy migration lint failed:", file=sys.stderr)

        for issue in all_issues:
            print(f"  - {issue}", file=sys.stderr)

        print(
            "See docs/runbooks/ROLLING_DEPLOY_MIGRATIONS.md and add allow-list entry only for documented historical scripts.",
            file=sys.stderr,
        )

        return 1

    print(f"Rolling-deploy lint passed for {len(paths)} migration file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
