/* 301 — Covering index for GetPagedSummariesByRunIdAsync (typed TB-931 scalars; no TraceJson key lookup). */

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AgentExecutionTraces_RunId_CreatedUtc_Summary'
         AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_RunId_CreatedUtc_Summary
        ON dbo.AgentExecutionTraces (RunId, CreatedUtc)
        INCLUDE (
            TraceId,
            TaskId,
            AgentType,
            ParseSucceeded,
            ModelDeploymentName,
            BlobUploadFailed,
            InputTokenCount,
            OutputTokenCount,
            EstimatedCostUsd,
            ModelAlias,
            QualityWarning,
            QualityRejected);
END
GO
