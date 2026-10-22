/*
  R294: Rollback 294_AgentExecutionTraces_HotScalarColumns.sql —
  drop TB-931 typed hot scalars (and default constraints) from dbo.AgentExecutionTraces.
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NULL
    RETURN;
GO

IF OBJECT_ID(N'dbo.DF_AgentExecutionTraces_QualityWarning', N'D') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP CONSTRAINT DF_AgentExecutionTraces_QualityWarning;
GO

IF OBJECT_ID(N'dbo.DF_AgentExecutionTraces_QualityRejected', N'D') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP CONSTRAINT DF_AgentExecutionTraces_QualityRejected;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'InputTokenCount') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN InputTokenCount;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'OutputTokenCount') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN OutputTokenCount;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ReasoningTokenCount') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN ReasoningTokenCount;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'EstimatedCostUsd') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN EstimatedCostUsd;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ModelAlias') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN ModelAlias;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityWarning') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN QualityWarning;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityRejected') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN QualityRejected;
GO
