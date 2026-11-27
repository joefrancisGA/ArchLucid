#!/usr/bin/env python3
"""Exercise the append-only runtime finding journal against disposable SQL."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from pathlib import Path
import re
import uuid

from fnd010_sql_journal_verify import sql

MIGRATION = Path("ArchLucid.Persistence/Migrations/435_RuntimeFindingEvidenceJournal.sql")
ROLLBACK = Path("ArchLucid.Persistence/Migrations/Rollback/R435_RuntimeFindingEvidenceJournal.sql")


def apply(path, success=True):
    for batch in re.split(r"(?im)^\s*GO\s*$", path.read_text(encoding="utf-8")):
        if batch.strip():
            sql(batch, success=success)


def main():
    sql("""
        IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NULL CREATE ROLE ArchLucidApp;
        IF DATABASE_PRINCIPAL_ID(N'RuntimeFindingTest') IS NULL
        BEGIN
            CREATE USER RuntimeFindingTest WITHOUT LOGIN;
            ALTER ROLE ArchLucidApp ADD MEMBER RuntimeFindingTest;
        END
    """)
    apply(MIGRATION)
    apply(MIGRATION)
    tenant, workspace, project, other = [str(uuid.uuid4()) for _ in range(4)]
    scope = uuid.uuid4().hex * 2
    payload = b'{"finding":"fixture"}'
    digest = sha256(payload).hexdigest()

    def append(tenant_id=tenant, hash_value=digest, expected=1):
        result = sql(f"""
            SET NOCOUNT ON;
            EXECUTE AS USER='RuntimeFindingTest';
            EXEC dbo.AppendRuntimeFindingEvidence
              @tenant='{tenant_id}', @workspace='{workspace}', @project='{project}',
              @scopeHash=0x{scope}, @payloadHash=0x{hash_value}, @payload=0x{payload.hex()};
            REVERT;
        """)
        assert re.findall(r"(?m)^\s*([01])\s*$", result) == [str(expected)], result

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda _: append(), range(8)))
    append(other)
    append(hash_value="00" * 32, expected=0)
    append("00000000-0000-0000-0000-000000000000", expected=0)
    result = sql(f"""
        SET NOCOUNT ON;
        SELECT COUNT(*) FROM dbo.RuntimeFindingEvidenceJournal
        WHERE ScopeHash=0x{scope} AND PayloadHash=0x{digest};
    """)
    assert re.findall(r"(?m)^\s*(\d+)\s*$", result) == ["2"], result
    for statement in (
        "DELETE FROM dbo.RuntimeFindingEvidenceJournal",
        "UPDATE dbo.RuntimeFindingEvidenceJournal SET RecordedUtc=SYSUTCDATETIME()",
        "INSERT dbo.RuntimeFindingEvidenceJournal SELECT * FROM dbo.RuntimeFindingEvidenceJournal",
    ):
        sql("EXECUTE AS USER='RuntimeFindingTest'; " + statement + "; REVERT;", success=False)
    # SET XACT_ABORT is a successful standalone batch; only the rollback transaction must fail.
    batches = [b for b in re.split(r"(?im)^\s*GO\s*$", ROLLBACK.read_text(encoding="utf-8")) if b.strip()]
    assert len(batches) == 1
    sql(batches[0], success=False)
    append()
    print("PASS: runtime finding journal concurrent idempotency, scope separation, digest and mutation guards")


if __name__ == "__main__":
    main()
