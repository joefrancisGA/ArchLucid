/*
  R237: Rollback 237_AgentResults_RunId_TaskId_Unique.sql — drop unique index on (RunId, TaskId).
*/

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_AgentResults_RunId_TaskId'
      AND object_id = OBJECT_ID(N'dbo.AgentResults'))
    DROP INDEX UX_AgentResults_RunId_TaskId ON dbo.AgentResults;
GO
