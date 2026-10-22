/* Full prompt/response blob pointers + model metadata on agent execution traces (optional; see AgentExecution:TraceStorage:PersistFullPrompts). */

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullSystemPromptBlobKey') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullSystemPromptBlobKey NVARCHAR(2048) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullUserPromptBlobKey') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullUserPromptBlobKey NVARCHAR(2048) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullResponseBlobKey') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullResponseBlobKey NVARCHAR(2048) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ModelDeploymentName') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ModelDeploymentName NVARCHAR(260) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ModelVersion') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ModelVersion NVARCHAR(200) NULL;
END
GO
