IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_FindingsSnapshots_HasWarnings_RunId'
      AND object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
    DROP INDEX IX_FindingsSnapshots_HasWarnings_RunId ON dbo.FindingsSnapshots;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_AlertRecords_RunId_Open'
      AND object_id = OBJECT_ID(N'dbo.AlertRecords'))
    DROP INDEX IX_AlertRecords_RunId_Open ON dbo.AlertRecords;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Runs_Scope_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.Runs'))
    DROP INDEX IX_Runs_Scope_CreatedUtc ON dbo.Runs;
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
        IsPinned,
        IsSample,
        RealModeFellBackToSimulator,
        PilotAoaiDeploymentSnapshot)
    WHERE ArchivedUtc IS NULL;
GO
