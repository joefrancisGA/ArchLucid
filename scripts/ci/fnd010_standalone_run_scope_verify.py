#!/usr/bin/env python3
"""Check standalone run migration 432 on the disposable FND-010 SQL Server."""
from __future__ import annotations

import hashlib
from pathlib import Path
import re
from uuid import uuid4

from scripts.ci.fnd010_sql_journal_verify import sql

MIGRATION = Path("ArchLucid.Persistence/Migrations/432_ArchitectureIntelligenceStandaloneRuns.sql")
TABLE = "dbo.ArchitectureIntelligenceStandaloneRuns"
AS_APP = "EXECUTE AS USER = 'Fnd010StandaloneTest';"


def main() -> None:
    sql("""
        IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NULL CREATE ROLE ArchLucidApp;
        CREATE USER Fnd010StandaloneTest WITHOUT LOGIN;
        ALTER ROLE ArchLucidApp ADD MEMBER Fnd010StandaloneTest;
    """)

    batches = [batch for batch in re.split(r"(?im)^\s*GO\s*$", MIGRATION.read_text(encoding="utf-8"))
               if batch.strip()]
    for _ in range(2):
        for batch in batches:
            sql(batch)

    run, tenant, workspace, project = (str(uuid4()) for _ in range(4))
    owner_hash = hashlib.sha256(b"standalone-owner").hexdigest()
    different_owner = hashlib.sha256(b"another-owner").hexdigest()
    sql(f"""
        {AS_APP}
        INSERT INTO {TABLE} (RunId,TenantId,WorkspaceId,ProjectId,ActorKeyHash)
        VALUES ('{run}','{tenant}','{workspace}','{project}',0x{owner_hash});
        REVERT;
    """)

    def matches(t: str, w: str, p: str, actor: str, expected: int, label: str) -> None:
        sql(f"""
            {AS_APP}
            IF (SELECT COUNT(*) FROM {TABLE}
                WHERE RunId='{run}' AND TenantId='{t}' AND WorkspaceId='{w}'
                    AND ProjectId='{p}' AND ActorKeyHash=0x{actor}) <> {expected}
                THROW 50001, N'Unexpected ownership match for {label}.', 1;
            REVERT;
        """)

    matches(tenant, workspace, project, owner_hash, 1, "owner and scope")
    matches(str(uuid4()), workspace, project, owner_hash, 0, "different tenant")
    matches(tenant, str(uuid4()), project, owner_hash, 0, "different workspace")
    matches(tenant, workspace, str(uuid4()), owner_hash, 0, "different project")
    matches(tenant, workspace, project, different_owner, 0, "different actor")

    sql(f"""
        {AS_APP}
        INSERT INTO {TABLE} (RunId,TenantId,WorkspaceId,ProjectId,ActorKeyHash)
        VALUES ('{run}','{tenant}','{workspace}','{uuid4()}',0x{different_owner});
        REVERT;
    """, success=False)
    sql(f"{AS_APP} UPDATE {TABLE} SET ActorKeyHash=0x{different_owner} WHERE RunId='{run}'; REVERT;",
        success=False)
    sql(f"{AS_APP} DELETE FROM {TABLE} WHERE RunId='{run}'; REVERT;", success=False)
    matches(tenant, workspace, project, owner_hash, 1, "binding retained")

    print("PASS: migration 432 reapplies, grants read/insert, isolates actor and scope, and rejects rebinding.")


if __name__ == "__main__":
    main()
