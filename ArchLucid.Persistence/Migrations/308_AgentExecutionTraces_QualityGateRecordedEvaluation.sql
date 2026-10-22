/* 308 — TB-964: persist evaluate-time quality scores + reject category + triage id on traces. */

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedStructuralCompletenessRatio') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD RecordedStructuralCompletenessRatio FLOAT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedSemanticScore') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD RecordedSemanticScore FLOAT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedRejectReasonCategory') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD RecordedRejectReasonCategory NVARCHAR(32) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedTriageScenarioId') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD RecordedTriageScenarioId NVARCHAR(64) NULL;
END;
GO
