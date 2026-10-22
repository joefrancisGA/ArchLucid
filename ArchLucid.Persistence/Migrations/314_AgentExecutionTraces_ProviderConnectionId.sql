/*
  314: Provider connection provenance on agent execution traces (TB-872).
*/
IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ProviderConnectionId') IS NULL
    ALTER TABLE dbo.AgentExecutionTraces ADD ProviderConnectionId NVARCHAR(64) NULL;
GO
