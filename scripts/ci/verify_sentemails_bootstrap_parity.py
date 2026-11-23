#!/usr/bin/env python3
"""Fail fast if the consolidated SQL bootstrap diverges from migration 424.

The standalone migration already uses parameterized sp_executesql for a quoted
constraint identifier; the bootstrap script must not regress to EXEC(expr).
"""
from pathlib import Path
import re


def verify(root: Path) -> None:
    migration = (root / "ArchLucid.Persistence/Migrations/424_SentEmails_TenantScopedIdempotency.sql")
    bootstrap = (root / "ArchLucid.Persistence/Scripts/ArchLucid.sql")
    canonical = migration.read_text(encoding="utf-8").strip()
    consolidated = bootstrap.read_text(encoding="utf-8")

    if canonical not in consolidated:
        raise ValueError(
            "Consolidated SentEmails bootstrap must contain the exact canonical "
            "migration 424 block; do not inline QUOTENAME inside EXEC()."
        )
    if re.search(
        r"EXEC\s*\(\s*N'ALTER TABLE dbo\.SentEmails DROP CONSTRAINT '\s*\+\s*QUOTENAME",
        consolidated,
        flags=re.IGNORECASE,
    ):
        raise ValueError("Invalid SentEmails EXEC(QUOTENAME(...)) SQL remains")


if __name__ == "__main__":
    verify(Path(__file__).resolve().parents[2])
    print("SentEmails bootstrap migration 424 parity: OK")
