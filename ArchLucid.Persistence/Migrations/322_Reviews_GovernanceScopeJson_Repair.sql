/*
  322 — Repair GovernanceScopeJson on the physical run/review table after ADR 0064.

  Why this migration exists:
    Migration 295 renamed dbo.Runs -> dbo.Reviews and left dbo.Runs as a SYNONYM.
    Migration 321 then guarded ALTER TABLE with
    `IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL`. A synonym reports as 'SN', never 'U',
    so 321 was a no-op on every post-295 catalog while DbUp still journaled it. Runtime
    SELECT of GovernanceScopeJson then fails with "Invalid column name 'GovernanceScopeJson'"
    (SQL error 207). Data-consistency reconciliation records that error, and GET /health/ready
    returns 503.

  DbUp never re-runs a journaled script, so 321 cannot repair those catalogs — this
  forward script does.

  Resolves the physical table (post-295 dbo.Reviews first, pre-295 dbo.Runs fallback).
  COL_LENGTH and OBJECT_ID(..., N'U') both return NULL for a synonym. DDL runs through
  sp_executesql so SQL Server defers column binding until after the ALTER has executed.
*/

/* CREATE TRIGGER binds QUOTED_IDENTIFIER at parse time for the following batch.
   SqlClient defaults it on; sqlcmd defaults it off. */
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
    IF COL_LENGTH(@runTable, N'GovernanceScopeJson') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @runTable + N' ADD GovernanceScopeJson NVARCHAR(MAX) NULL;';

        EXEC sp_executesql @sql;
    END

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
              OR EXISTS (SELECT i.GovernanceScopeJson EXCEPT SELECT d.GovernanceScopeJson)
          ))
    BEGIN
        THROW 50310, N''Committed run header evidence anchors are immutable (TB-310).'', 1;
    END;
END;';

    EXEC sp_executesql @sql;
END
GO
