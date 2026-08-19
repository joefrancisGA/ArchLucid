/* R299: Rollback 299_AgentExecutionTraces_QualityGateRecordedSnapshot.sql */

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NULL
    RETURN;

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'RecordedQualityGateOutcome') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN RecordedQualityGateOutcome;

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityGateDefinitionContentHashSha256') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN QualityGateDefinitionContentHashSha256;

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityGateDefinitionVersion') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN QualityGateDefinitionVersion;
