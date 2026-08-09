/* 299 — TB-973: persist evaluate-time quality-gate definition snapshot on traces. */

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityGateDefinitionVersion') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD QualityGateDefinitionVersion NVARCHAR(64) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityGateDefinitionContentHashSha256') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD QualityGateDefinitionContentHashSha256 CHAR(64) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedQualityGateOutcome') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD RecordedQualityGateOutcome TINYINT NULL;
END;
GO
