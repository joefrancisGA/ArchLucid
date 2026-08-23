/*
  R322: Rollback 322_Reviews_GovernanceScopeJson_Repair.sql —
  restore the seal trigger without GovernanceScopeJson, then drop the column
  from the physical run/review table (dbo.Reviews after ADR 0064, else dbo.Runs).

  Resolves the physical table rather than the dbo.Runs synonym: OBJECT_ID(..., N'U')
  and COL_LENGTH both return NULL when handed a synonym name.
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
BEGIN
    SET @sql = N'
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
          ))
    BEGIN
        THROW 50310, N''Committed run header evidence anchors are immutable (TB-310).'', 1;
    END;
END;';

    EXEC sp_executesql @sql;

    IF COL_LENGTH(@runTable, N'GovernanceScopeJson') IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN GovernanceScopeJson;';

        EXEC sp_executesql @sql;
    END
END
GO
