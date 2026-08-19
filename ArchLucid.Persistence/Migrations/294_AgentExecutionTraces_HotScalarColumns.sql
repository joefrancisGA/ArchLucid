/* 294 — TB-931: typed hot scalars on AgentExecutionTraces for cost/list projections.

   Dual-write targets so list badges and LLM cost rollups stop using JSON_VALUE(TraceJson, …).
   Best-effort backfill from camelCase TraceJson properties (ContractJson default naming). */

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'InputTokenCount') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD InputTokenCount INT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'OutputTokenCount') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD OutputTokenCount INT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ReasoningTokenCount') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ReasoningTokenCount INT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'EstimatedCostUsd') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD EstimatedCostUsd DECIMAL(18, 6) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ModelAlias') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ModelAlias NVARCHAR(260) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityWarning') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD QualityWarning BIT NOT NULL
            CONSTRAINT DF_AgentExecutionTraces_QualityWarning DEFAULT (0);

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityRejected') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD QualityRejected BIT NOT NULL
            CONSTRAINT DF_AgentExecutionTraces_QualityRejected DEFAULT (0);
END;
GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentExecutionTraces', N'InputTokenCount') IS NOT NULL
BEGIN
    UPDATE dbo.AgentExecutionTraces
    SET InputTokenCount = COALESCE(
            InputTokenCount,
            TRY_CAST(JSON_VALUE(TraceJson, '$.inputTokenCount') AS int)),
        OutputTokenCount = COALESCE(
            OutputTokenCount,
            TRY_CAST(JSON_VALUE(TraceJson, '$.outputTokenCount') AS int)),
        ReasoningTokenCount = COALESCE(
            ReasoningTokenCount,
            TRY_CAST(JSON_VALUE(TraceJson, '$.reasoningTokenCount') AS int)),
        EstimatedCostUsd = COALESCE(
            EstimatedCostUsd,
            TRY_CAST(JSON_VALUE(TraceJson, '$.estimatedCostUsd') AS decimal(18, 6))),
        ModelAlias = COALESCE(
            ModelAlias,
            LEFT(JSON_VALUE(TraceJson, '$.modelAlias'), 260)),
        QualityWarning = CASE
            WHEN TRY_CAST(JSON_VALUE(TraceJson, '$.qualityWarning') AS bit) = 1 THEN 1
            ELSE QualityWarning
        END,
        QualityRejected = CASE
            WHEN TRY_CAST(JSON_VALUE(TraceJson, '$.qualityRejected') AS bit) = 1 THEN 1
            ELSE QualityRejected
        END
    WHERE TraceJson IS NOT NULL;
END;
GO
