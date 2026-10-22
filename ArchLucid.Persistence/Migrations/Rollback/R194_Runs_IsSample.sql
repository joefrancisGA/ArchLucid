IF COL_LENGTH(N'dbo.Runs', N'IsSample') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Runs_Scope_CreatedUtc'
          AND object_id = OBJECT_ID(N'dbo.Runs'))
    BEGIN
        DROP INDEX IX_Runs_Scope_CreatedUtc ON dbo.Runs;
    END;

    ALTER TABLE dbo.Runs DROP CONSTRAINT IF EXISTS DF_Runs_IsSample;
    ALTER TABLE dbo.Runs DROP COLUMN IsSample;

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
            RealModeFellBackToSimulator,
            PilotAoaiDeploymentSnapshot)
        WHERE ArchivedUtc IS NULL;
END;
GO
