/*
  390 — CG-019: persist Working Career vs Rehearsal door on the run header at first execute start.

  After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. OBJECT_ID(..., N'U')
  and COL_LENGTH on the synonym are NULL, so ALTER TABLE dbo.Runs is a no-op (or SQL 4909).
  DDL targets the physical table (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql.

  StructuralExecutionMode already exists (INV-002). This migration adds the Working door stamp
  and captured UTC, then freezes both columns after GoldenManifestId is set (TB-310).
*/

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'WorkingCareerRehearsalDoor') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD
        WorkingCareerRehearsalDoor NVARCHAR(16) NULL,
        ExecutePostureCapturedUtc DATETIME2 NULL,
        CONSTRAINT CK_Runs_WorkingCareerRehearsalDoor CHECK (
            WorkingCareerRehearsalDoor IS NULL OR WorkingCareerRehearsalDoor IN (N''career'', N''rehearsal''));';

    EXEC sp_executesql @sql;
END
GO

DECLARE @sealTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

IF @sealTable IS NOT NULL
BEGIN
    DECLARE @sealSql NVARCHAR(MAX) = N'
CREATE OR ALTER TRIGGER dbo.TR_Runs_SealCommittedHeader
ON ' + @sealTable + N'
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM inserted)
        RETURN;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d ON d.RunId = i.RunId
        WHERE d.GoldenManifestId IS NOT NULL
          AND (
              EXISTS (SELECT i.RunId EXCEPT SELECT d.RunId)
              OR EXISTS (SELECT i.ProjectId EXCEPT SELECT d.ProjectId)
              OR EXISTS (SELECT i.TenantId EXCEPT SELECT d.TenantId)
              OR EXISTS (SELECT i.WorkspaceId EXCEPT SELECT d.WorkspaceId)
              OR EXISTS (SELECT i.ScopeProjectId EXCEPT SELECT d.ScopeProjectId)
              OR EXISTS (SELECT i.CreatedUtc EXCEPT SELECT d.CreatedUtc)
              OR EXISTS (SELECT i.ContextSnapshotId EXCEPT SELECT d.ContextSnapshotId)
              OR EXISTS (SELECT i.GraphSnapshotId EXCEPT SELECT d.GraphSnapshotId)
              OR EXISTS (SELECT i.FindingsSnapshotId EXCEPT SELECT d.FindingsSnapshotId)
              OR EXISTS (SELECT i.GoldenManifestId EXCEPT SELECT d.GoldenManifestId)
              OR EXISTS (SELECT i.DecisionTraceId EXCEPT SELECT d.DecisionTraceId)
              OR EXISTS (SELECT i.ArtifactBundleId EXCEPT SELECT d.ArtifactBundleId)
              OR EXISTS (SELECT i.CurrentManifestVersion EXCEPT SELECT d.CurrentManifestVersion)
              OR EXISTS (SELECT i.StructuralExecutionMode EXCEPT SELECT d.StructuralExecutionMode)
              OR EXISTS (SELECT i.OtelTraceId EXCEPT SELECT d.OtelTraceId)
              OR EXISTS (SELECT i.EngineProvenanceJson EXCEPT SELECT d.EngineProvenanceJson)
              OR EXISTS (SELECT i.GovernanceScopeJson EXCEPT SELECT d.GovernanceScopeJson)
              OR EXISTS (SELECT i.WorkingCareerRehearsalDoor EXCEPT SELECT d.WorkingCareerRehearsalDoor)
              OR EXISTS (SELECT i.ExecutePostureCapturedUtc EXCEPT SELECT d.ExecutePostureCapturedUtc)
          ))
    BEGIN
        THROW 50310, N''Committed run header evidence anchors are immutable (TB-310).'', 1;
    END;
END;';

    EXEC sp_executesql @sealSql;
END
GO
