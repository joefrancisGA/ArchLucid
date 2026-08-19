/*
  Roll back DbUp 153 — remove Runs.IsDemoWelcomeRun and restore IX_Runs_Scope_CreatedUtc
  to the migration-123 INCLUDE shape (without IsDemoWelcomeRun; parity with 123_Runs_Scope_Index_Include_Extensions.sql).
*/

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Runs_Scope_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.Runs'))
BEGIN
    DROP INDEX IX_Runs_Scope_CreatedUtc ON dbo.Runs;
END;
GO

CREATE NONCLUSTERED INDEX IX_Runs_Scope_CreatedUtc
    ON dbo.Runs (TenantId, WorkspaceId, ScopeProjectId, CreatedUtc DESC)
    INCLUDE (
        RunId,
        ProjectId,
        Description,
        ContextSnapshotId,
        GraphSnapshotId,
        FindingsSnapshotId,
        GoldenManifestId,
        DecisionTraceId,
        ArtifactBundleId,
        ArchitectureRequestId,
        LegacyRunStatus,
        CompletedUtc,
        CurrentManifestVersion,
        OtelTraceId,
        IsPublicShowcase,
        RealModeFellBackToSimulator,
        PilotAoaiDeploymentSnapshot)
    WHERE ArchivedUtc IS NULL;
GO

IF COL_LENGTH(N'dbo.Runs', N'IsDemoWelcomeRun') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs DROP CONSTRAINT IF EXISTS DF_Runs_IsDemoWelcomeRun;
    ALTER TABLE dbo.Runs DROP COLUMN IsDemoWelcomeRun;
END;
GO
