/*
  R390: Rollback 390_Runs_ExecutePostureStamp.sql —
  restore the seal trigger without the execute-posture columns, then drop those columns
  from the physical run/review table (dbo.Reviews after ADR 0064, else dbo.Runs).
*/

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

IF @runTable IS NOT NULL
BEGIN
    DECLARE @sealSql NVARCHAR(MAX) = N'
CREATE OR ALTER TRIGGER dbo.TR_Runs_SealCommittedHeader
ON ' + @runTable + N'
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
          ))
    BEGIN
        THROW 50310, N''Committed run header evidence anchors are immutable (TB-310).'', 1;
    END;
END;';

    EXEC sp_executesql @sealSql;
END
GO

DECLARE @dropTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

IF @dropTable IS NOT NULL
   AND COL_LENGTH(@dropTable, N'WorkingCareerRehearsalDoor') IS NOT NULL
BEGIN
    DECLARE @dropSql NVARCHAR(MAX) =
        N'ALTER TABLE ' + @dropTable + N' DROP CONSTRAINT CK_Runs_WorkingCareerRehearsalDoor;
          ALTER TABLE ' + @dropTable + N' DROP COLUMN ExecutePostureCapturedUtc;
          ALTER TABLE ' + @dropTable + N' DROP COLUMN WorkingCareerRehearsalDoor;';

    EXEC sp_executesql @dropSql;
END
GO
