#!/usr/bin/env python3
"""Verify precision and standalone-run rollbacks on the disposable FND-010 SQL container.

Uses the existing SQL test harness, not a configured production connection.
"""
from pathlib import Path
import re

from scripts.ci.fnd010_sql_journal_verify import sql

ROOT = Path("ArchLucid.Persistence/Migrations")


def apply(name: str, *, expected_error: int | None = None) -> None:
    batches = [b for b in re.split(r"(?im)^\s*GO\s*$",
        (ROOT / name).read_text(encoding="utf-8-sig")) if b.strip()]
    if expected_error is not None:
        assert len(batches) == 1, "Negative rollback must be a single atomic batch"
        result = sql(batches[0], success=False)
        assert re.search(rf"\bMsg {expected_error}\b", result), result
    else:
        for batch in batches:
            sql(batch)


def precision() -> None:
    forward = "430_SecurityEvidenceCutPointLeveragePrecision.sql"
    rollback = "Rollback/R430_SecurityEvidenceCutPointLeveragePrecision.sql"
    apply("383_SecurityEvidenceCutPoints.sql")
    apply(forward)
    sql("""
        INSERT dbo.SecurityEvidenceCutPoints
        (CutPointId,TenantId,SnapshotId,RuleVersion,CutKind,CutKey,
         PathsCollapsedCount,OperationalCostClass,LeverageScore,CutOrder,
         EvidenceReferencesJson,CollapsedPathIdsJson,ComputedUtc)
        VALUES (NEWID(),NEWID(),NEWID(),N'test',0,N'rollback-test',
                100,1,100000.123,1,N'[]',N'[]',SYSUTCDATETIME());
    """)
    apply(rollback, expected_error=51430)
    sql("""
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.SecurityEvidenceCutPoints')
            AND name=N'LeverageScore' AND precision=22 AND scale=3)
            THROW 50001, N'Failed rollback changed precision.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.SecurityEvidenceCutPoints WHERE CutKey=N'rollback-test'
            AND LeverageScore=100000.123)
            THROW 50001, N'Failed rollback lost evidence.', 1;
        UPDATE dbo.SecurityEvidenceCutPoints SET LeverageScore=99999.123 WHERE CutKey=N'rollback-test';
    """)
    apply(rollback)
    apply(rollback)
    sql("""
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.SecurityEvidenceCutPoints')
            AND name=N'LeverageScore' AND precision=8 AND scale=3)
            THROW 50001, N'Original precision was not restored.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.SecurityEvidenceCutPoints WHERE CutKey=N'rollback-test'
            AND LeverageScore=99999.123)
            THROW 50001, N'Rollback changed representable evidence.', 1;
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.SecurityEvidenceCutPoints')
            AND name=N'IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage')
            THROW 50001, N'Leverage index missing.', 1;
    """)
    apply(forward)
    sql("""
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID(N'dbo.SecurityEvidenceCutPoints')
            AND name=N'LeverageScore' AND precision=22 AND scale=3)
            THROW 50001, N'Forward reapplication failed.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.SecurityEvidenceCutPoints WHERE CutKey=N'rollback-test'
            AND LeverageScore=99999.123)
            THROW 50001, N'Forward reapplication changed evidence.', 1;
    """)


def standalone() -> None:
    forward = "432_ArchitectureIntelligenceStandaloneRuns.sql"
    rollback = "Rollback/R432_ArchitectureIntelligenceStandaloneRuns.sql"
    # Existing FND-010 scope integration runs first and leaves evidence.
    apply(rollback, expected_error=51432)
    sql("""
        IF NOT EXISTS (SELECT 1 FROM dbo.ArchitectureIntelligenceStandaloneRuns)
            THROW 50001, N'Failed rollback discarded evidence.', 1;
        -- Disposable CI database only; clear fixture rows to exercise the empty-table case.
        DELETE FROM dbo.ArchitectureIntelligenceStandaloneRuns;
    """)
    apply(rollback)
    apply(rollback)
    sql("""
        IF OBJECT_ID(N'dbo.ArchitectureIntelligenceStandaloneRuns', N'U') IS NOT NULL
            THROW 50001, N'Empty table rollback failed.', 1;
    """)
    apply(forward)
    sql("""
        IF OBJECT_ID(N'dbo.ArchitectureIntelligenceStandaloneRuns', N'U') IS NULL
            THROW 50001, N'Forward reapplication failed.', 1;
        EXECUTE AS USER = 'Fnd010StandaloneTest';
        INSERT dbo.ArchitectureIntelligenceStandaloneRuns
        (RunId,TenantId,WorkspaceId,ProjectId,ActorKeyHash)
        VALUES (NEWID(),NEWID(),NEWID(),NEWID(),CONVERT(BINARY(32),0x01));
        REVERT;
    """)


if __name__ == "__main__":
    precision()
    standalone()
    print("PASS: rollback 430/432 rejection, retention, reversal, idempotency and forward reapplication")
