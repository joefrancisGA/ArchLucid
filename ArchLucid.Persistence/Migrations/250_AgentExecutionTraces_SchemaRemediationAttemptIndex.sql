/*
  TB-035 — persist schema-remediation attempt traces with AttemptIndex on AgentExecutionTraces.
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'AttemptIndex') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD AttemptIndex INT NOT NULL
            CONSTRAINT DF_AgentExecutionTraces_AttemptIndex DEFAULT (0);

    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentExecutionTraces_RunId_TaskId_AgentType'
          AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
        DROP INDEX UX_AgentExecutionTraces_RunId_TaskId_AgentType ON dbo.AgentExecutionTraces;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentExecutionTraces_RunId_TaskId_AgentType_AttemptIndex'
          AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
        CREATE UNIQUE INDEX UX_AgentExecutionTraces_RunId_TaskId_AgentType_AttemptIndex
            ON dbo.AgentExecutionTraces (RunId, TaskId, AgentType, AttemptIndex);
END;
GO
