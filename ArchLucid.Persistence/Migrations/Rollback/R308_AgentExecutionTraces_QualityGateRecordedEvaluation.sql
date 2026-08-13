IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedTriageScenarioId') IS NOT NULL
        ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN RecordedTriageScenarioId;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedRejectReasonCategory') IS NOT NULL
        ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN RecordedRejectReasonCategory;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedSemanticScore') IS NOT NULL
        ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN RecordedSemanticScore;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedStructuralCompletenessRatio') IS NOT NULL
        ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN RecordedStructuralCompletenessRatio;
END;
GO
