/*
  Improvement #27 — dbo.DecisionTraces.RunId NVARCHAR(64) -> UNIQUEIDENTIFIER + FK dbo.Runs.
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NULL
BEGIN
    PRINT N'#27 DecisionTraces: table missing; skipping.';
END;
ELSE IF COL_LENGTH(N'dbo.DecisionTraces', N'RunId') IS NULL
    AND COL_LENGTH(N'dbo.DecisionTraces', N'RunIdGuid') IS NOT NULL
    EXEC sp_rename N'dbo.DecisionTraces.RunIdGuid', N'RunId', N'COLUMN';
ELSE IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.DecisionTraces')
      AND c.name = N'RunId'
      AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisionTraces_Run')
        ALTER TABLE dbo.DecisionTraces DROP CONSTRAINT FK_DecisionTraces_Run;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisionTraces_Runs_RunId')
        ALTER TABLE dbo.DecisionTraces DROP CONSTRAINT FK_DecisionTraces_Runs_RunId;

    IF COL_LENGTH(N'dbo.DecisionTraces', N'RunIdGuid') IS NULL
        ALTER TABLE dbo.DecisionTraces ADD RunIdGuid UNIQUEIDENTIFIER NULL;

    UPDATE dbo.DecisionTraces
    SET RunIdGuid = TRY_CAST(RunId AS UNIQUEIDENTIFIER)
    WHERE RunIdGuid IS NULL;

    DELETE t
    FROM dbo.DecisionTraces AS t
    WHERE t.RunIdGuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = t.RunIdGuid);

    IF EXISTS (SELECT 1 FROM dbo.DecisionTraces WHERE RunIdGuid IS NULL AND RunId IS NOT NULL)
        THROW 50027, N'#27 DecisionTraces: backfill incomplete — orphaned RunId strings found.', 1;

    ALTER TABLE dbo.DecisionTraces ALTER COLUMN RunIdGuid UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.DecisionTraces') AND name = N'IX_DecisionTraces_RunId')
        DROP INDEX IX_DecisionTraces_RunId ON dbo.DecisionTraces;

    ALTER TABLE dbo.DecisionTraces DROP COLUMN RunId;

    EXEC sp_rename N'dbo.DecisionTraces.RunIdGuid', N'RunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisionTraces', N'RunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.DecisionTraces')
         AND c.name = N'RunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.DecisionTraces') AND name = N'IX_DecisionTraces_RunId')
        CREATE NONCLUSTERED INDEX IX_DecisionTraces_RunId ON dbo.DecisionTraces (RunId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisionTraces_Runs_RunId')
        ALTER TABLE dbo.DecisionTraces WITH NOCHECK
            ADD CONSTRAINT FK_DecisionTraces_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO
