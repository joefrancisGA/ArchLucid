/*
  Improvement #27 — dbo.AgentTasks.RunId NVARCHAR(64) -> UNIQUEIDENTIFIER + FK dbo.Runs.
  Idempotent: safe to re-run.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NULL
BEGIN
    PRINT N'#27 AgentTasks: table missing; skipping.';
END;
GO

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentTasks', N'RunId') IS NULL
   AND COL_LENGTH(N'dbo.AgentTasks', N'RunIdGuid') IS NOT NULL
BEGIN
    EXEC sp_rename N'dbo.AgentTasks.RunIdGuid', N'RunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.AgentTasks')
         AND c.name = N'RunId'
         AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentTasks_Run')
        ALTER TABLE dbo.AgentTasks DROP CONSTRAINT FK_AgentTasks_Run;

    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentTasks_Runs_RunId')
        ALTER TABLE dbo.AgentTasks DROP CONSTRAINT FK_AgentTasks_Runs_RunId;

    IF COL_LENGTH(N'dbo.AgentTasks', N'RunIdGuid') IS NULL
        ALTER TABLE dbo.AgentTasks ADD RunIdGuid UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentTasks', N'RunIdGuid') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.AgentTasks')
         AND c.name = N'RunId'
         AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    UPDATE dbo.AgentTasks
    SET RunIdGuid = TRY_CAST(RunId AS UNIQUEIDENTIFIER)
    WHERE RunIdGuid IS NULL;

    DELETE t
    FROM dbo.AgentTasks AS t
    WHERE t.RunIdGuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = t.RunIdGuid);

    IF EXISTS (SELECT 1 FROM dbo.AgentTasks WHERE RunIdGuid IS NULL AND RunId IS NOT NULL)
        THROW 50027, N'#27 AgentTasks: backfill incomplete — orphaned RunId strings found.', 1;

    ALTER TABLE dbo.AgentTasks ALTER COLUMN RunIdGuid UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentTasks') AND name = N'IX_AgentTasks_RunId_AgentType')
        DROP INDEX IX_AgentTasks_RunId_AgentType ON dbo.AgentTasks;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentTasks') AND name = N'IX_AgentTasks_RunId')
        DROP INDEX IX_AgentTasks_RunId ON dbo.AgentTasks;

    ALTER TABLE dbo.AgentTasks DROP COLUMN RunId;

    EXEC sp_rename N'dbo.AgentTasks.RunIdGuid', N'RunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentTasks', N'RunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.AgentTasks')
         AND c.name = N'RunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentTasks') AND name = N'IX_AgentTasks_RunId')
        CREATE NONCLUSTERED INDEX IX_AgentTasks_RunId ON dbo.AgentTasks (RunId);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AgentTasks') AND name = N'IX_AgentTasks_RunId_AgentType')
        CREATE NONCLUSTERED INDEX IX_AgentTasks_RunId_AgentType ON dbo.AgentTasks (RunId, AgentType);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentTasks_Runs_RunId')
        ALTER TABLE dbo.AgentTasks WITH NOCHECK
            ADD CONSTRAINT FK_AgentTasks_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO
