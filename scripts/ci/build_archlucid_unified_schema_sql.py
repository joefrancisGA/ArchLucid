"""Emit ArchLucid_Unified_Schema.sql as a DDL-only subset of Scripts/ArchLucid.sql."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MASTER = ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid.sql"
MIGRATIONS = ROOT / "ArchLucid.Persistence" / "Migrations"
OUT = ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid_Unified_Schema.sql"

MIGRATION_NUMBER_PATTERN = re.compile(r"^(\d+)_")

HEADER_TEMPLATE = """/*
  ArchLucid_Unified_Schema.sql

  GENERATED FILE — DO NOT EDIT BY HAND. Edit ArchLucid.Persistence/Scripts/ArchLucid.sql and
  regenerate; CI fails when this file drifts from generator output (check_archlucid_unified_schema_snapshot).

  REFERENCE AND IaC ALIGNMENT ONLY. This script is NOT executed by DbUp, SqlSchemaBootstrapper,
  or deployment pipelines unless you deliberately wire it yourself.

  PURPOSE
    Consolidated declarative DDL (CREATE TABLE, CREATE INDEX, ALTER TABLE batches only) reflecting
    the final schema shape after sequential application of forward DbUp migrations
    ArchLucid.Persistence/Migrations/{first}_*.sql … {last}_*.sql (excluding Rollback/).

  HOW THIS ARTIFACT RELATES TO MIGRATIONS
    Forward migrations remain the authoritative upgrade path on existing databases.
    This file is mechanically derived from ArchLucid.Persistence/Scripts/ArchLucid.sql—the same master
    greenfield DDL that CI requires to co-change with forward migrations—and therefore matches the
    final desired relational object model those migrations converge on.

    Regenerate after ArchLucid.sql changes:
      python scripts/ci/build_archlucid_unified_schema_sql.py

  OMITTED BATCH TYPES (present in ArchLucid.sql but not IaC-declarative table/index/column DDL here)
    RLS EXEC blocks, DENY/GRANT, standalone stored procedures/functions, EXEC-only batches, SET
    without accompanying DDL where applicable.

  SET ANSI_NULLS ON;
  SET QUOTED_IDENTIFIER ON;
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

"""


def forward_migration_numbers() -> list[str]:
    """Numeric prefixes of the forward migrations, in order.

    Read from disk rather than hardcoded so the header cannot claim a migration range that
    stopped being true the next time a migration was added.
    """

    numbers: list[str] = []

    for path in sorted(MIGRATIONS.glob("*.sql")):
        match = MIGRATION_NUMBER_PATTERN.match(path.name)

        if match is not None:
            numbers.append(match.group(1))

    return numbers


def build_header() -> str:
    """Header text with the forward-migration range filled in from the Migrations folder."""

    numbers = forward_migration_numbers()

    if not numbers:
        raise SystemExit(f"no numbered forward migrations found under {MIGRATIONS}")

    return HEADER_TEMPLATE.format(first=numbers[0], last=numbers[-1])


def split_go_batches(sql: str) -> list[str]:
    return [b.strip() for b in re.split(r"(?m)^\s*GO\s*$", sql) if b.strip()]


def strip_sql_comments_for_scan(batch: str) -> str:
    """Remove /* */ and -- line comments so documentation cannot trigger DDL detection."""
    without_blocks = re.sub(r"/\*.*?\*/", "", batch, flags=re.S)
    return re.sub(r"--[^\n]*", "", without_blocks)


def batch_has_declarative_ddl(batch: str) -> bool:
    u = strip_sql_comments_for_scan(batch).upper()

    if "CREATE TABLE" in u:
        return True

    if re.search(r"\bCREATE\s+(?:UNIQUE\s+)?(?:CLUSTERED\s+|NONCLUSTERED\s+)?INDEX\b", u):
        return True

    if "ALTER TABLE" in u:
        return True

    return False


def declarative_ddl_batches() -> list[str]:
    """GO batches of the master DDL that declare tables, indexes, or columns."""

    master_text = MASTER.read_text(encoding="utf-8")

    return [batch for batch in split_go_batches(master_text) if batch_has_declarative_ddl(batch)]


def render_unified_schema() -> str:
    """Full snapshot text.

    Exposed as a pure function so the CI drift guard can compare against it without
    reimplementing the assembly step or writing into the repo.
    """

    return build_header() + "\n\nGO\n\n".join(declarative_ddl_batches()) + "\n"


def main() -> None:
    rendered = render_unified_schema()
    OUT.write_text(rendered, encoding="utf-8")

    print(f"Wrote {OUT} ({len(declarative_ddl_batches())} GO batches)")


if __name__ == "__main__":
    main()
