/*
  163: INV-002 — dbo.Runs.StructuralExecutionMode NOT NULL execution labeling + extend IX_Runs_Scope_CreatedUtc INCLUDE.
*/

IF COL_LENGTH(N'dbo.Runs', N'StructuralExecutionMode') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD
        StructuralExecutionMode NVARCHAR(32) NOT NULL
            CONSTRAINT DF_Runs_StructuralExecutionMode155 DEFAULT (N'Simulator'),
        CONSTRAINT CK_Runs_StructuralExecutionMode155 CHECK (StructuralExecutionMode IN (N'Simulator', N'Real', N'Fallback', N'Mixed'));

    -- Same-batch UPDATE cannot see a column added by ALTER TABLE (compile-time metadata); defer compilation.
    EXEC (N'UPDATE dbo.Runs SET StructuralExecutionMode = N''Fallback'' WHERE RealModeFellBackToSimulator = 1;');
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
        RealModeFellBackToSimulator,
        PilotAoaiDeploymentSnapshot,
        StructuralExecutionMode)
    WHERE ArchivedUtc IS NULL;
GO
