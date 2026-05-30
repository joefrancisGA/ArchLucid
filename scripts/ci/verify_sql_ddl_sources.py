#!/usr/bin/env python3
"""Verify product SQL DDL stays in canonical ArchLucid persistence paths (assessment #14)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

CANONICAL_SCRIPT = Path("ArchLucid.Persistence/Scripts/ArchLucid.sql")
MIGRATIONS_GLOB = Path("ArchLucid.Persistence/Migrations")

ALLOWED_DDL_PREFIXES: tuple[str, ...] = (
    "ArchLucid.Persistence/Scripts/",
    "ArchLucid.Persistence/Migrations/",
)

ALLOWED_DDL_EXCEPTIONS: frozenset[str] = frozenset(
    {
        "ArchLucid.Persistence.Tests/Sql/schema-test.sql",
    }
)

CREATE_TABLE_PATTERN = re.compile(r"^\s*CREATE\s+TABLE\s+(?:\[?dbo\]?\.)?\[?(?P<name>[A-Za-z0-9_]+)\]?", re.IGNORECASE)


def _normalize_path(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def _is_allowed_ddl_path(relative_path: str) -> bool:
    if relative_path in ALLOWED_DDL_EXCEPTIONS:
        return True

    return any(relative_path.startswith(prefix) for prefix in ALLOWED_DDL_PREFIXES)


def _scan_create_tables(path: Path) -> list[str]:
    tables: list[str] = []

    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        match = CREATE_TABLE_PATTERN.match(line)

        if match is None:
            continue

        tables.append(match.group("name").lower())

    return tables


def verify_sql_ddl_sources(root: Path) -> list[str]:
    errors: list[str] = []
    canonical = root / CANONICAL_SCRIPT

    if not canonical.is_file():
        errors.append(f"missing canonical DDL script: {CANONICAL_SCRIPT.as_posix()}")
        return errors

    migrations_path = root / MIGRATIONS_GLOB

    if not migrations_path.is_dir():
        errors.append(f"missing migrations directory: {MIGRATIONS_GLOB.as_posix()}")
    else:
        migration_files = sorted(migrations_path.rglob("*.sql"))

        if not migration_files:
            errors.append("no incremental migration SQL files found under ArchLucid.Persistence/Migrations")

        for migration in migration_files:
            relative = _normalize_path(migration, root)
            migration_tables = _scan_create_tables(migration)
            migration_counts: dict[str, int] = {}

            for table in migration_tables:
                migration_counts[table] = migration_counts.get(table, 0) + 1

            for table, count in migration_counts.items():
                if count > 1:
                    errors.append(
                        f"duplicate CREATE TABLE for '{table}' in {relative}",
                    )

    for sql_file in root.rglob("*.sql"):
        relative = _normalize_path(sql_file, root)

        if _is_allowed_ddl_path(relative):
            continue

        text = sql_file.read_text(encoding="utf-8", errors="replace")

        if CREATE_TABLE_PATTERN.search(text):
            errors.append(
                f"CREATE TABLE outside approved DDL paths: {relative} "
                "(allowed: ArchLucid.Persistence/Scripts, ArchLucid.Persistence/Migrations)",
            )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args(argv)

    errors = verify_sql_ddl_sources(args.repo_root)

    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)

        return 1

    print("OK: SQL DDL source guard passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
