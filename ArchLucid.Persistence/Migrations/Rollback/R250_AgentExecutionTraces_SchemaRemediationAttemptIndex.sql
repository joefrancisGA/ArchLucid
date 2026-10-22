/*
  Rollback TB-035 — drop AttemptIndex unique index and column on AgentExecutionTraces.
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentExecutionTraces_RunId_TaskId_AgentType_AttemptIndex'
          AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
        DROP INDEX UX_AgentExecutionTraces_RunId_TaskId_AgentType_AttemptIndex ON dbo.AgentExecutionTraces;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentExecutionTraces_RunId_TaskId_AgentType'
          AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
        CREATE UNIQUE INDEX UX_AgentExecutionTraces_RunId_TaskId_AgentType
            ON dbo.AgentExecutionTraces (RunId, TaskId, AgentType);

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'AttemptIndex') IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID(N'dbo.AgentExecutionTraces')
              AND name = N'DF_AgentExecutionTraces_AttemptIndex')
            ALTER TABLE dbo.AgentExecutionTraces DROP CONSTRAINT DF_AgentExecutionTraces_AttemptIndex;

        ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN AttemptIndex;
    END
END;
GO
