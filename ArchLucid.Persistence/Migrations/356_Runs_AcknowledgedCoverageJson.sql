/*
  356 — Persist pre-execute coverage acknowledgement JSON on the run/review header.

  After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. OBJECT_ID(..., N'U')
  and COL_LENGTH on the synonym are NULL, so ALTER TABLE dbo.Runs is a no-op (or SQL 4909).
  DDL targets the physical table (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql.

  Catalogs that already journaled the synonym-guarded revision of this script need migration 359.
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
