/*
  R298: Rollback 298_AgentResults_TaskExecutionMode.sql —
  drop TB-970 per-task execution mode + cache-served columns from dbo.AgentResults.
*/

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NULL
    RETURN;
GO

IF OBJECT_ID(N'dbo.DF_AgentResults_CacheServed', N'D') IS NOT NULL
    ALTER TABLE dbo.AgentResults DROP CONSTRAINT DF_AgentResults_CacheServed;
GO

IF COL_LENGTH(N'dbo.AgentResults', N'CacheServed') IS NOT NULL
    ALTER TABLE dbo.AgentResults DROP COLUMN CacheServed;
GO

IF COL_LENGTH(N'dbo.AgentResults', N'TaskStructuralExecutionMode') IS NOT NULL
    ALTER TABLE dbo.AgentResults DROP COLUMN TaskStructuralExecutionMode;
GO
