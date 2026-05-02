/*
  Roll back DbUp 137 — dbo.ComparisonRecords LeftRunId / RightRunId back to NVARCHAR(64) (no FK).

  Restore stores CONVERT(NVARCHAR(36), guid); extended data loss when values were not RFC GUID strings on legacy rows.
*/

IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_ComparisonRecords_Runs_LeftRunIdGuid'
      AND parent_object_id = OBJECT_ID(N'dbo.ComparisonRecords'))
    ALTER TABLE dbo.ComparisonRecords DROP CONSTRAINT FK_ComparisonRecords_Runs_LeftRunIdGuid;
GO

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_ComparisonRecords_Runs_RightRunIdGuid'
      AND parent_object_id = OBJECT_ID(N'dbo.ComparisonRecords'))
    ALTER TABLE dbo.ComparisonRecords DROP CONSTRAINT FK_ComparisonRecords_Runs_RightRunIdGuid;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
      AND name = N'IX_ComparisonRecords_LeftRunId')
    DROP INDEX IX_ComparisonRecords_LeftRunId ON dbo.ComparisonRecords;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
      AND name = N'IX_ComparisonRecords_RightRunId')
    DROP INDEX IX_ComparisonRecords_RightRunId ON dbo.ComparisonRecords;
GO

IF COL_LENGTH(N'dbo.ComparisonRecords', N'LeftRunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ComparisonRecords')
         AND c.name = N'LeftRunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    ALTER TABLE dbo.ComparisonRecords ADD LeftRunIdRevert NVARCHAR(64) NULL;

    UPDATE dbo.ComparisonRecords
    SET LeftRunIdRevert = CONVERT(NVARCHAR(36), LeftRunId)
    WHERE LeftRunId IS NOT NULL;

    ALTER TABLE dbo.ComparisonRecords DROP COLUMN LeftRunId;

    EXEC sp_rename N'dbo.ComparisonRecords.LeftRunIdRevert', N'LeftRunId', N'COLUMN';
END;
GO

IF COL_LENGTH(N'dbo.ComparisonRecords', N'RightRunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ComparisonRecords')
         AND c.name = N'RightRunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    ALTER TABLE dbo.ComparisonRecords ADD RightRunIdRevert NVARCHAR(64) NULL;

    UPDATE dbo.ComparisonRecords
    SET RightRunIdRevert = CONVERT(NVARCHAR(36), RightRunId)
    WHERE RightRunId IS NOT NULL;

    ALTER TABLE dbo.ComparisonRecords DROP COLUMN RightRunId;

    EXEC sp_rename N'dbo.ComparisonRecords.RightRunIdRevert', N'RightRunId', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
      AND name = N'IX_ComparisonRecords_LeftRunId')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_LeftRunId ON dbo.ComparisonRecords (LeftRunId);
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords')
      AND name = N'IX_ComparisonRecords_RightRunId')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_RightRunId ON dbo.ComparisonRecords (RightRunId);
GO
