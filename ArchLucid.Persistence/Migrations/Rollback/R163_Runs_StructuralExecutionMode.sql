/*
  Roll back DbUp 163 — remove StructuralExecutionMode and restore IX_Runs_Scope_CreatedUtc without that INCLUDE.
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
        IsDemoWelcomeRun,
        IsPublicShowcase,
        RealModeFellBackToSimulator,
        PilotAoaiDeploymentSnapshot)
    WHERE ArchivedUtc IS NULL;
GO

IF COL_LENGTH(N'dbo.Runs', N'StructuralExecutionMode') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs DROP CONSTRAINT IF EXISTS CK_Runs_StructuralExecutionMode155;
    ALTER TABLE dbo.Runs DROP CONSTRAINT IF EXISTS DF_Runs_StructuralExecutionMode155;
    ALTER TABLE dbo.Runs DROP COLUMN StructuralExecutionMode;
END;
GO
