/*
  Rollback TB-044 — drop unique index on AgentExecutionTraces (RunId, TaskId, AgentType).
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_AgentExecutionTraces_RunId_TaskId_AgentType'
         AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
    DROP INDEX UX_AgentExecutionTraces_RunId_TaskId_AgentType ON dbo.AgentExecutionTraces;
GO
