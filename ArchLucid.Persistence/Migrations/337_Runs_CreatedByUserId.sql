/*
  337 — Capture review-run creator identity for work-ownership delete policy.

  After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH on the
  synonym returns NULL, so ALTER TABLE dbo.Runs raises SQL 4909. DDL targets the physical
  table (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql.
*/

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'CreatedByUserId') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD CreatedByUserId NVARCHAR(256) NULL;';

    EXEC sp_executesql @sql;
END
GO
