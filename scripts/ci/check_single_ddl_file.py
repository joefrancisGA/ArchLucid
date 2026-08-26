#!/usr/bin/env python3
"""Enforce one consolidated DDL file per database under ArchLucid.Persistence/Scripts."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "ArchLucid.Persistence" / "Scripts"

# Canonical consolidated DDL per bounded database context (see docs/library/SQL_SCRIPTS.md §2).
ALLOWED_ROOT_DDL = frozenset(
    {
        "ArchLucid.sql",
        "ArchLucid.Master.sql",
        "ArchLucid.System.sql",
        "ArchLucid_Unified_Schema.sql",
    }
)

# Optional read-only maintenance / diagnostic scripts — not schema DDL.
ALLOWED_MAINTENANCE = frozenset(
    {
        "QueryStore-ArchLucid-hotpaths.sql",
        "Backfill-FirstManifestCommittedUtc.sql",
    }
)


def main() -> int:
    if not SCRIPTS.is_dir():
        print(f"Missing Scripts folder: {SCRIPTS}", file=sys.stderr)
        return 2

    errors: list[str] = []

    root_sql = sorted(p.name for p in SCRIPTS.glob("*.sql"))

    for name in root_sql:
        if name not in ALLOWED_ROOT_DDL:
            errors.append(
                f"Unexpected consolidated DDL at Scripts/{name}. "
                f"Update {name} inside the canonical file for its database context instead."
            )

    missing = ALLOWED_ROOT_DDL - frozenset(root_sql)

    for name in sorted(missing):
        errors.append(f"Missing required consolidated DDL: Scripts/{name}")

    maintenance_dir = SCRIPTS / "Maintenance"

    if maintenance_dir.is_dir():
        for path in sorted(maintenance_dir.glob("*.sql")):
            if path.name not in ALLOWED_MAINTENANCE:
                errors.append(
                    f"Unexpected SQL under Scripts/Maintenance/{path.name}. "
                    "Register in check_single_ddl_file.py or move to Migrations/."
                )

    # Block ad-hoc DDL folders beside Scripts/Maintenance.
    for child in SCRIPTS.iterdir():
        if not child.is_dir() or child.name == "Maintenance":
            continue

        if any(child.glob("*.sql")):
            errors.append(
                f"Unexpected SQL DDL folder: Scripts/{child.name}/. "
                "Consolidated DDL belongs in ArchLucid.sql or ArchLucid.System.sql."
            )

    if errors:
        print("Single-DDL-per-database guard failed:", file=sys.stderr)

        for err in errors:
            print(f"  - {err}", file=sys.stderr)

        return 1

    print(
        "Scripts/ DDL layout OK "
        f"({len(ALLOWED_ROOT_DDL)} consolidated files, {len(ALLOWED_MAINTENANCE)} maintenance scripts)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
