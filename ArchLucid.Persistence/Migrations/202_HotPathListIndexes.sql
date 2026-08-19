/*
  202: Hot-path run list indexes — filtered seeks for HasWarnings / HasGovernanceWarnings EXISTS
  and expanded IX_Runs_Scope_CreatedUtc INCLUDE (Improvement #26).
*/

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_FindingsSnapshots_HasWarnings_RunId'
      AND object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FindingsSnapshots_HasWarnings_RunId
        ON dbo.FindingsSnapshots (RunId)
        WHERE ArchivedUtc IS NULL AND HasWarnings = 1;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_AlertRecords_RunId_Open'
      AND object_id = OBJECT_ID(N'dbo.AlertRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AlertRecords_RunId_Open
        ON dbo.AlertRecords (RunId)
        WHERE Status = N'Open';
END;
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
        IsPinned,
        IsSample,
        RealModeFellBackToSimulator,
        PilotAoaiDeploymentSnapshot,
        StructuralExecutionMode,
        RetryCount,
        LastFailureReason)
    WHERE ArchivedUtc IS NULL;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_Runs_RunId')
    ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId')
    ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId')
    ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId;
GO
