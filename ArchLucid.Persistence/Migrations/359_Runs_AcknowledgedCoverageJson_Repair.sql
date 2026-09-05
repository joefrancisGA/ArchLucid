/*
  359 — Repair AcknowledgedCoverageJson on the physical run/review table after ADR 0064.

  Why this migration exists:
    Migration 356 guarded ALTER TABLE with `IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL`.
    After migration 295, dbo.Runs is a SYNONYM (type SN, never U), so 356 was a no-op on
    post-295 catalogs while DbUp still journaled it. Runtime SELECT of AcknowledgedCoverageJson
    then fails with "Invalid column name 'AcknowledgedCoverageJson'" (SQL error 207).
    Data-consistency reconciliation records that error, and GET /health/ready returns 503.

  DbUp never re-runs a journaled script, so 356 cannot repair those catalogs — this forward
  script does.

  Resolves the physical table (post-295 dbo.Reviews first, pre-295 dbo.Runs fallback).
*/

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'AcknowledgedCoverageJson') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD AcknowledgedCoverageJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @sql;
END
GO
