/*
  Improvement #27 — dbo.AgentExecutionTraces.RunId NVARCHAR(64) -> UNIQUEIDENTIFIER + FK dbo.Runs.
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NULL
BEGIN
    PRINT N'#27 AgentExecutionTraces: table missing; skipping.';
END;
ELSE IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RunId') IS NULL
    AND COL_LENGTH(N'dbo.AgentExecutionTraces', N'RunIdGuid') IS NOT NULL
    EXEC sp_rename N'dbo.AgentExecutionTraces.RunIdGuid', N'RunId', N'COLUMN';
ELSE IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.AgentExecutionTraces')
      AND c.name = N'RunId'
      AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentExecutionTraces_Run')
        ALTER TABLE dbo.AgentExecutionTraces DROP CONSTRAINT FK_AgentExecutionTraces_Run;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentExecutionTraces_Runs_RunId')
        ALTER TABLE dbo.AgentExecutionTraces DROP CONSTRAINT FK_AgentExecutionTraces_Runs_RunId;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RunIdGuid') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD RunIdGuid UNIQUEIDENTIFIER NULL;

    UPDATE dbo.AgentExecutionTraces
    SET RunIdGuid = TRY_CAST(RunId AS UNIQUEIDENTIFIER)
    WHERE RunIdGuid IS NULL;

    DELETE t
    FROM dbo.AgentExecutionTraces AS t
    WHERE t.RunIdGuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = t.RunIdGuid);

    IF EXISTS (SELECT 1 FROM dbo.AgentExecutionTraces WHERE RunIdGuid IS NULL AND RunId IS NOT NULL)
        THROW 50027, N'#27 AgentExecutionTraces: backfill incomplete — orphaned RunId strings found.', 1;

    ALTER TABLE dbo.AgentExecutionTraces ALTER COLUMN RunIdGuid UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentExecutionTraces') AND name = N'IX_AgentExecutionTraces_RunId')
        DROP INDEX IX_AgentExecutionTraces_RunId ON dbo.AgentExecutionTraces;

    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN RunId;

    EXEC sp_rename N'dbo.AgentExecutionTraces.RunIdGuid', N'RunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentExecutionTraces', N'RunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.AgentExecutionTraces')
         AND c.name = N'RunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentExecutionTraces') AND name = N'IX_AgentExecutionTraces_RunId')
        CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_RunId ON dbo.AgentExecutionTraces (RunId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentExecutionTraces_Runs_RunId')
        ALTER TABLE dbo.AgentExecutionTraces WITH NOCHECK
            ADD CONSTRAINT FK_AgentExecutionTraces_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO
