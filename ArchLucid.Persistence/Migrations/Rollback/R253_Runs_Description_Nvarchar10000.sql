/*
  R253: Rollback 253_Runs_Description_Nvarchar10000.sql — revert dbo.Runs.Description to baseline width.
  IX_Runs_Scope_CreatedUtc INCLUDEs Description — drop before ALTER COLUMN.
*/

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'Description') = -1
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Runs_Scope_CreatedUtc'
          AND object_id = OBJECT_ID(N'dbo.Runs'))
    BEGIN
        DROP INDEX IX_Runs_Scope_CreatedUtc ON dbo.Runs;
    END;

    ALTER TABLE dbo.Runs ALTER COLUMN Description NVARCHAR(4000) NULL;
END;
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'Description') = 4000
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_Runs_Scope_CreatedUtc'
         AND object_id = OBJECT_ID(N'dbo.Runs'))
BEGIN
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
            IsPinned,
            IsSample,
            RealModeFellBackToSimulator,
            PilotAoaiDeploymentSnapshot,
            StructuralExecutionMode,
            RetryCount,
            LastFailureReason)
        WHERE ArchivedUtc IS NULL;
END;
GO
