#!/usr/bin/env python3
"""Verify remediation permission, precision and standalone-run rollbacks on the disposable FND-010 SQL container.

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


def permissions() -> None:
    """Exercise actual permission migrations on synthetic tables in disposable SQL."""
    forwards = [
        "426_RemediationRoleWritePermissions.sql",
        "427_RemediationProcedureOnlyUpdates.sql",
        "428_RemediationProcedureOnlyInserts.sql",
    ]
    rollbacks = ["Rollback/R" + name for name in forwards]
    sql("""
        IF DB_NAME() <> N'master'
            THROW 50001, N'Unexpected disposable SQL harness catalog.', 1;
        IF OBJECT_ID(N'dbo.RemediationInstances') IS NOT NULL
            OR OBJECT_ID(N'dbo.RemediationEvidence') IS NOT NULL
            OR OBJECT_ID(N'dbo.RemediationRollbackUnrelated') IS NOT NULL
            THROW 50001, N'Rollback fixture already exists; refusing to overwrite.', 1;
        CREATE TABLE dbo.RemediationInstances (InstanceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY);
        CREATE TABLE dbo.RemediationEvidence (EvidenceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY);
        CREATE TABLE dbo.RemediationRollbackUnrelated (Id INT NOT NULL);
        IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NULL CREATE ROLE [ArchLucidApp];
        GRANT SELECT ON OBJECT::dbo.RemediationInstances TO [ArchLucidApp];
        DENY DELETE ON OBJECT::dbo.RemediationRollbackUnrelated TO [ArchLucidApp];
        INSERT dbo.RemediationInstances VALUES (NEWID());
        INSERT dbo.RemediationEvidence VALUES (NEWID());
    """)
    # SQL Server validates column references on existing tables at CREATE
    # PROCEDURE time. Include the columns referenced by the actual procedures.
    # Add all referenced fields to the disposable fixture before applying SQL.
    sql("""
        ALTER TABLE dbo.RemediationInstances ADD
            TenantId UNIQUEIDENTIFIER NULL, WorkspaceId UNIQUEIDENTIFIER NULL,
            ProjectId UNIQUEIDENTIFIER NULL, FindingId UNIQUEIDENTIFIER NULL,
            PatternId UNIQUEIDENTIFIER NULL, PatternVersionId UNIQUEIDENTIFIER NULL,
            PatternKey NVARCHAR(256) NULL, FrozenPatternVersion NVARCHAR(64) NULL,
            AutomationLevel INT NULL, Status INT NULL, CloudResourceId UNIQUEIDENTIFIER NULL,
            PathId UNIQUEIDENTIFIER NULL, PathNarrativeJson NVARCHAR(MAX) NULL,
            AssessmentId UNIQUEIDENTIFIER NULL, ControlId UNIQUEIDENTIFIER NULL,
            PreflightSnapshotId UNIQUEIDENTIFIER NULL, ExecutionSnapshotId UNIQUEIDENTIFIER NULL,
            VerificationSnapshotId UNIQUEIDENTIFIER NULL, WaveId UNIQUEIDENTIFIER NULL,
            PreflightResultJson NVARCHAR(MAX) NULL, VerificationResultJson NVARCHAR(MAX) NULL,
            CreatedByActorKey NVARCHAR(256) NULL, ApprovedByActorKey NVARCHAR(256) NULL,
            CreatedUtc DATETIME2 NULL, UpdatedUtc DATETIME2 NULL, ApprovedUtc DATETIME2 NULL,
            ExecutedUtc DATETIME2 NULL, ChangeImplementedUtc DATETIME2 NULL,
            VerifiedUtc DATETIME2 NULL, ClosedUtc DATETIME2 NULL, RowVersion ROWVERSION;
        ALTER TABLE dbo.RemediationEvidence ADD
            InstanceId UNIQUEIDENTIFIER NULL, TenantId UNIQUEIDENTIFIER NULL, Phase INT NULL,
            PayloadJson NVARCHAR(MAX) NULL, ActorKey NVARCHAR(256) NULL,
            CorrelationId NVARCHAR(128) NULL, CreatedUtc DATETIME2 NULL;
    """)

    def check(expected_denies: int, expected_procedures: int) -> None:
        sql(f"""
            IF (SELECT COUNT(*) FROM sys.database_permissions
                WHERE grantee_principal_id=DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
                  AND class=1 AND minor_id=0 AND state='D'
                  AND major_id IN (OBJECT_ID(N'dbo.RemediationInstances'),
                                   OBJECT_ID(N'dbo.RemediationEvidence'))) <> {expected_denies}
                THROW 50001, N'Unexpected remediation DENY count.', 1;
            IF (SELECT COUNT(*) FROM sys.procedures
                WHERE schema_id=SCHEMA_ID(N'dbo') AND name IN
                    (N'uspRemediationUpdateScoped',N'uspRemediationCommitApproval',
                     N'uspRemediationCommitVerification',N'uspRemediationCreateScoped',
                     N'uspRemediationAppendEvidenceScoped')) <> {expected_procedures}
                THROW 50001, N'Unexpected guarded procedure count.', 1;
            IF (SELECT COUNT(*) FROM sys.database_permissions
                WHERE grantee_principal_id=DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
                  AND class=1 AND minor_id=0 AND permission_name=N'EXECUTE' AND state='G'
                  AND major_id IN (OBJECT_ID(N'dbo.uspRemediationUpdateScoped'),
                    OBJECT_ID(N'dbo.uspRemediationCommitApproval'),
                    OBJECT_ID(N'dbo.uspRemediationCommitVerification'),
                    OBJECT_ID(N'dbo.uspRemediationCreateScoped'),
                    OBJECT_ID(N'dbo.uspRemediationAppendEvidenceScoped'))) <> {expected_procedures}
                THROW 50001, N'Unexpected guarded procedure EXECUTE grants.', 1;
            IF NOT EXISTS (SELECT 1 FROM sys.database_permissions
                WHERE grantee_principal_id=DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
                  AND major_id=OBJECT_ID(N'dbo.RemediationRollbackUnrelated')
                  AND permission_name=N'DELETE' AND state='D')
                THROW 50001, N'Unrelated DENY changed.', 1;
            IF NOT EXISTS (SELECT 1 FROM sys.database_permissions
                WHERE grantee_principal_id=DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
                  AND major_id=OBJECT_ID(N'dbo.RemediationInstances')
                  AND permission_name=N'SELECT' AND state='G')
                THROW 50001, N'Existing SELECT grant changed.', 1;
            IF (SELECT COUNT(*) FROM dbo.RemediationInstances) <> 1
                OR (SELECT COUNT(*) FROM dbo.RemediationEvidence) <> 1
                THROW 50001, N'Rollback modified fixture evidence.', 1;
        """)

    for forward in forwards:
        apply(forward)
    check(6, 5)
    apply(rollbacks[0], expected_error=51426)
    apply(rollbacks[1], expected_error=51427)
    check(6, 5)
    for rollback, counts in zip(reversed(rollbacks), [(4, 3), (3, 0), (0, 0)]):
        apply(rollback)
        check(*counts)
        apply(rollback)
        check(*counts)
    for forward in forwards:
        apply(forward)
    check(6, 5)
    print("PASS: rollback 426/427/428 ordering, permission isolation, retention and forward reapplication")


if __name__ == "__main__":
    precision()
    standalone()
    permissions()
    print("PASS: rollback 430/432 rejection, retention, reversal, idempotency and forward reapplication")
