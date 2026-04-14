-- 064: Flag when mandatory SQL inline fallback for full agent trace text could not be completed.
IF COL_LENGTH('dbo.AgentExecutionTraces', 'InlineFallbackFailed') IS NULL
BEGIN
    ALTER TABLE dbo.AgentExecutionTraces
        ADD InlineFallbackFailed BIT NULL;
END
