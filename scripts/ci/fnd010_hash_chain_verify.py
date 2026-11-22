#!/usr/bin/env python3
"""Verify atomic hash-chain migration and tamper-evident links on disposable SQL."""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import re
import uuid

from fnd010_sql_journal_verify import sql


def check_chain() -> None:
    migration = Path("ArchLucid.Persistence/Migrations/355_AuthorizationDecisionHashChain.sql")
    for batch in re.split(r"(?im)^\s*GO\s*$", migration.read_text()):
        if batch.strip():
            sql(batch)
    def append(i: int) -> None:
        sql(f"""EXEC dbo.AppendAuthorizationDecision
          @decision='{uuid.uuid4()}', @tenant='{uuid.uuid4()}',
          @workspace='{uuid.uuid4()}', @project='{uuid.uuid4()}',
          @resource='{uuid.uuid4()}', @action=N'evidence.read',
          @allowed=1, @reason=N'authorized',
          @caller=N'authenticated-principal', @occurred='2026-11-22T12:00:00+00:00'""")
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(append, range(12)))
    # Verify every link and every content hash using the persisted bytes.
    result = sql("""
       SET NOCOUNT ON;
       WITH C AS (
         SELECT SequenceNo, PreviousHash, RecordHash, Payload,
           LAG(RecordHash) OVER(ORDER BY SequenceNo) AS ExpectedPrevious
         FROM dbo.AuthorizationDecisionChain
       )
       SELECT COUNT(*) FROM C WHERE
          PreviousHash <> COALESCE(ExpectedPrevious, CONVERT(VARBINARY(32),REPLICATE('0',64),2))
          OR RecordHash <> HASHBYTES('SHA2_256',
             0x01 + PreviousHash + HASHBYTES('SHA2_256', Payload))
    """)
    if not re.search(r"(?m)^\s*0\s*$", result):
        raise AssertionError("Hash-chain integrity failure: " + result)
    count = sql("SET NOCOUNT ON; SELECT COUNT(*) FROM dbo.AuthorizationDecisionChain")
    if not re.search(r"(?m)^\s*12\s*$", count):
        raise AssertionError("Concurrent inserts missing: " + count)
    sql("UPDATE dbo.AuthorizationDecisionChain SET RecordHash=0x00 WHERE SequenceNo=1",
        success=False)
    sql("DELETE dbo.AuthorizationDecisionChain WHERE SequenceNo=1", success=False)
    print("PASS: 12 concurrent appends, chain verification, mutation denial")


if __name__ == "__main__":
    check_chain()
