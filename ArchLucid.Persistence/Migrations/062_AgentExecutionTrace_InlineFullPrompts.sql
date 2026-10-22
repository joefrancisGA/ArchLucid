-- Inline full prompt/response fallback when blob persistence fails (forensic completeness).

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullSystemPromptInline') IS NULL
    ALTER TABLE dbo.AgentExecutionTraces ADD FullSystemPromptInline NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullUserPromptInline') IS NULL
    ALTER TABLE dbo.AgentExecutionTraces ADD FullUserPromptInline NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullResponseInline') IS NULL
    ALTER TABLE dbo.AgentExecutionTraces ADD FullResponseInline NVARCHAR(MAX) NULL;
