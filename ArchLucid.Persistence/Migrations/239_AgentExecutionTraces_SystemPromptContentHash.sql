/*
  TB-191 — indexed prompt content-hash prefix on agent execution traces.
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentExecutionTraces', N'SystemPromptContentHash') IS NULL
    ALTER TABLE dbo.AgentExecutionTraces ADD SystemPromptContentHash NVARCHAR(32) NULL;
GO
