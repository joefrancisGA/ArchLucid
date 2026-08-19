IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NULL
    RETURN;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ProviderConnectionId') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN ProviderConnectionId;
GO
