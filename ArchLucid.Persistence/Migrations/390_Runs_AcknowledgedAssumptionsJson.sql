/*
  390 — Persist pre-finalize assumption acknowledgement JSON on the run/review header (TB-2345 item 49).

  Replaces the browser-local acknowledgement store so the server finalize gate can read what the operator
  confirmed. After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews; OBJECT_ID(..., N'U') and
  COL_LENGTH on the synonym are NULL, so DDL targets the physical table via sp_executesql (see 356/359).
*/

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'AcknowledgedAssumptionsJson') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD AcknowledgedAssumptionsJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @sql;
END
GO
