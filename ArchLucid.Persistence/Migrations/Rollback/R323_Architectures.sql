/*
  R323: Rollback 323_Architectures.sql —
  drop IX_Runs_ArchitectureId and ArchitectureId from the physical run/review table
  (dbo.Reviews after ADR 0064, else dbo.Runs), then drop dbo.Architectures.

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
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Runs_ArchitectureId'
          AND object_id = OBJECT_ID(@runTable))
    BEGIN
        SET @sql = N'DROP INDEX IX_Runs_ArchitectureId ON ' + @runTable + N';';

        EXEC sp_executesql @sql;
    END

    IF COL_LENGTH(@runTable, N'ArchitectureId') IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN ArchitectureId;';

        EXEC sp_executesql @sql;
    END
END
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
    DROP TABLE dbo.Architectures;
GO
