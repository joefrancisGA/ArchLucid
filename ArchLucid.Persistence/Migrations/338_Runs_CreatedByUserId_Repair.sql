/*
  338 — Repair CreatedByUserId on the physical run/review table after ADR 0064.

  Migration 337 guarded ALTER TABLE with `IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL`.
  After migration 295, dbo.Runs is a SYNONYM, so 337 was a no-op on post-295 catalogs while
  DbUp journaled it. This forward script repairs those catalogs.
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
