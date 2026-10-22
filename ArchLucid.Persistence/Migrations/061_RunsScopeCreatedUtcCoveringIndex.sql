-- 061: Covering IX_Runs_Scope_CreatedUtc — dashboard list covering index.
-- After ADR 0064 / migration 295, dbo.Runs may be a synonym — DDL only when base user table exists.

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Runs_Scope_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.Runs', N'U'))
    DROP INDEX IX_Runs_Scope_CreatedUtc ON dbo.Runs;
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Runs_Scope_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.Runs', N'U'))
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
            ArchivedUtc)
        WHERE ArchivedUtc IS NULL;
END
GO
