#!/usr/bin/env python3
"""FND-010 SQL Server integration verification against disposable CI container.

Uses sqlcmd inside the SQL Server container; no production database access.
"""
from __future__ import annotations

import os
from pathlib import Path
import re
import subprocess
import time
import uuid

CONTAINER = "fnd010-sql"
PASSWORD = os.environ["FND010_SQL_PASSWORD"]
MIGRATION = Path("ArchLucid.Persistence/Migrations/354_AuthorizationDecisionJournal.sql")


def sql(statement: str, *, success: bool = True) -> str:
    cmd = [
        "docker", "exec", "-i", CONTAINER,
        "/opt/mssql-tools18/bin/sqlcmd", "-S", "localhost", "-U", "sa",
        "-P", PASSWORD, "-C", "-b", "-r", "1", "-Q", statement,
    ]
    proc = subprocess.run(cmd, text=True, capture_output=True, timeout=40)
    if success and proc.returncode:
        raise AssertionError(f"SQL failed: {proc.stderr[-1000:]} {proc.stdout[-1000:]}")
    if not success and proc.returncode == 0:
        raise AssertionError(f"SQL unexpectedly succeeded: {statement[:100]}")
    return proc.stdout + proc.stderr


def main() -> None:
    for attempt in range(60):
        try:
            sql("SELECT 1")
            break
        except (AssertionError, subprocess.TimeoutExpired):
            if attempt == 59:
                raise
            time.sleep(2)

    # SQL Server sqlcmd batch separators are not T-SQL.
    batches = re.split(r"(?im)^\s*GO\s*$", MIGRATION.read_text(encoding="utf-8"))
    for batch in batches:
        if batch.strip():
            sql(batch)

    # Re-applying migration must be safe.
    for batch in batches:
        if batch.strip():
            sql(batch)

    decision = str(uuid.uuid4())
    tenant = str(uuid.uuid4())
    workspace = str(uuid.uuid4())
    project = str(uuid.uuid4())
    resource = str(uuid.uuid4())
    sql(f"""
        INSERT dbo.AuthorizationDecisionJournal
        (DecisionId,TenantId,WorkspaceId,ProjectId,ResourceId,
         ActionName,Allowed,ReasonCode,CallerKind,OccurredUtc)
        VALUES ('{decision}','{tenant}','{workspace}','{project}','{resource}',
                'evidence.read',1,'authorized','authenticated-principal',SYSUTCDATETIME())
    """)
    count = sql(f"""
        SET NOCOUNT ON;
        SELECT COUNT(*) FROM dbo.AuthorizationDecisionJournal
        WHERE DecisionId='{decision}' AND TenantId='{tenant}' AND Allowed=1
    """)
    if not re.search(r"(?m)^\s*1\s*$", count):
        raise AssertionError(f"Committed decision not readable: {count}")

    sql(f"""
        INSERT dbo.AuthorizationDecisionJournal
        (DecisionId,TenantId,WorkspaceId,ProjectId,ResourceId,
         ActionName,Allowed,ReasonCode,CallerKind,OccurredUtc)
        VALUES ('{decision}','{tenant}','{workspace}','{project}','{resource}',
                'evidence.read',1,'authorized','authenticated-principal',SYSUTCDATETIME())
    """, success=False)
    sql(f"UPDATE dbo.AuthorizationDecisionJournal SET Allowed=0 WHERE DecisionId='{decision}'",
        success=False)
    sql(f"DELETE dbo.AuthorizationDecisionJournal WHERE DecisionId='{decision}'",
        success=False)
    retained = sql(f"""
        SET NOCOUNT ON;
        SELECT COUNT(*) FROM dbo.AuthorizationDecisionJournal
        WHERE DecisionId='{decision}' AND Allowed=1
    """)
    if not re.search(r"(?m)^\s*1\s*$", retained):
        raise AssertionError("Journal changed after rejected mutation")
    print("PASS: migration rerun, committed insert, duplicate denial, update/delete denial, retention")


if __name__ == "__main__":
    main()
