/*
  R339: Rollback 339_ArchitectureVersions.sql —
  drop ArchitectureVersionId from the physical run/review table, then drop dbo.ArchitectureVersions.
*/

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
        WHERE name = N'IX_Runs_ArchitectureVersionId'
          AND object_id = OBJECT_ID(@runTable))
    BEGIN
        SET @sql = N'DROP INDEX IX_Runs_ArchitectureVersionId ON ' + @runTable + N';';

        EXEC sp_executesql @sql;
    END

    IF COL_LENGTH(@runTable, N'ArchitectureVersionId') IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN ArchitectureVersionId;';

        EXEC sp_executesql @sql;
    END
END
GO

IF OBJECT_ID(N'dbo.ArchitectureVersions', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ArchitectureVersions;
END;
GO
