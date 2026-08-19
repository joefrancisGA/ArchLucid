/* Rollback for migration 301: drop summary covering index on dbo.AgentExecutionTraces. */

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AgentExecutionTraces_RunId_CreatedUtc_Summary'
         AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
BEGIN
    DROP INDEX IX_AgentExecutionTraces_RunId_CreatedUtc_Summary ON dbo.AgentExecutionTraces;
END
GO
