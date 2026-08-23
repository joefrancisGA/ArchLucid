/*
  R321: Rollback 321_Runs_GovernanceScopeJson.sql.

  321 only mutated dbo.Runs when it was still a user table (pre-ADR 0064). After 295,
  dbo.Runs is a synonym and 321 was a no-op. Drop the column only from dbo.Runs as a
  user table. Catalogs that received the column via 322 should use R322 instead.
*/

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.TR_Runs_SealCommittedHeader', N'TR') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    EXEC(N'
CREATE OR ALTER TRIGGER dbo.TR_Runs_SealCommittedHeader
ON dbo.Runs
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
END;
');
END
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'GovernanceScopeJson') IS NOT NULL
    ALTER TABLE dbo.Runs DROP COLUMN GovernanceScopeJson;
GO
