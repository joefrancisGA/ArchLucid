/*
  R239: Rollback 239_AgentExecutionTraces_SystemPromptContentHash.sql — drop indexed prompt content-hash column.
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentExecutionTraces', N'SystemPromptContentHash') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN SystemPromptContentHash;
GO
