/*
  Trial welcome sample: flag runs seeded by DemoSeedService.SeedTrialWelcomeRunAsync for UI copy ("Sample run").
  Extends IX_Runs_Scope_CreatedUtc INCLUDE list (parity with migration 123).
*/

IF COL_LENGTH(N'dbo.Runs', N'IsDemoWelcomeRun') IS NULL
    ALTER TABLE dbo.Runs ADD IsDemoWelcomeRun BIT NOT NULL CONSTRAINT DF_Runs_IsDemoWelcomeRun DEFAULT (0);
GO

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
