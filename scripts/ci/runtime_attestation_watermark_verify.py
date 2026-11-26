#!/usr/bin/env python3
"""Exercise runtime replay watermarks against the existing disposable CI SQL container."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
import re
import uuid

from fnd010_sql_journal_verify import sql

MIGRATION = Path("ArchLucid.Persistence/Migrations/433_RuntimeAttestationWatermarks.sql")
ROLLBACK = Path("sql/rollbacks/433_rollback.sql")


def apply(path):
    for batch in re.split(r"(?im)^\s*GO\s*$", path.read_text(encoding="utf-8")):
        if batch.strip():
            sql(batch)


def main():
    sql("""
        IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NULL CREATE ROLE ArchLucidApp;
        IF DATABASE_PRINCIPAL_ID(N'RuntimeReplayTest') IS NULL
        BEGIN
          CREATE USER RuntimeReplayTest WITHOUT LOGIN;
          ALTER ROLE ArchLucidApp ADD MEMBER RuntimeReplayTest;
        END
    """)
    apply(MIGRATION)
    apply(MIGRATION)
    tenant, workspace, project, other = [str(uuid.uuid4()) for _ in range(4)]
    scope = uuid.uuid4().hex * 2
    base = datetime.now(timezone.utc) - timedelta(minutes=2)
    expires = base + timedelta(minutes=10)

    def attempt(offset, enumeration, digest, expected=None, tenant_id=tenant):
        issued = (base + timedelta(seconds=offset)).isoformat()
        observed = (base + timedelta(seconds=enumeration)).isoformat()
        result = sql(f"""
          SET NOCOUNT ON;
          EXECUTE AS USER = 'RuntimeReplayTest';
          EXEC dbo.TryAdvanceRuntimeAttestationWatermark
            @tenant='{tenant_id}', @workspace='{workspace}', @project='{project}',
            @scopeHash=0x{scope}, @issued='{issued}', @enumerated='{observed}',
            @expires='{expires.isoformat()}', @digest=0x{digest};
          REVERT;
        """)
        values = re.findall(r"(?m)^\s*([01])\s*$", result)
        assert len(values) == 1, result
        actual = int(values[0])
        if expected is not None:
            assert actual == expected, (offset, enumeration, actual, expected)
        return actual

    digest = "11" * 32
    attempt(0, -1, digest, 1)
    attempt(0, -1, digest, 1)  # new sqlcmd connection, persisted state
    attempt(0, -1, "22" * 32, 0)
    attempt(-1, -2, digest, 0)
    attempt(1, -2, digest, 0)  # newer issuance, older enumeration
    attempt(1, 0, digest, 1)
    attempt(0, -1, digest, 1, tenant_id=other)

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda i: attempt(i, i-1, digest), range(2, 10)))
    attempt(9, 8, digest, 1)
    attempt(8, 7, digest, 0)
    for verb in ("UPDATE dbo.RuntimeAttestationWatermarks SET PayloadDigest=0x00",
                 "DELETE FROM dbo.RuntimeAttestationWatermarks"):
        sql("EXECUTE AS USER='RuntimeReplayTest'; " + verb + "; REVERT;", success=False)
    for batch in re.split(r"(?im)^\s*GO\s*$", ROLLBACK.read_text(encoding="utf-8")):
        if batch.strip():
            sql(batch, success=False)
    attempt(9, 8, digest, 1)
    print("PASS: durable replay, concurrent advances, tenant isolation, mutation denial and guarded rollback")


if __name__ == "__main__":
    main()
