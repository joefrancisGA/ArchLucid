/*
  R224: Rollback 224_AgentExecutionTrace_ProvenanceCorrelationId.sql — drop provenance correlation column and index.
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_AgentExecutionTraces_ProvenanceCorrelationId'
      AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
    DROP INDEX IX_AgentExecutionTraces_ProvenanceCorrelationId ON dbo.AgentExecutionTraces;
GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ProvenanceCorrelationId') IS NOT NULL
    ALTER TABLE dbo.AgentExecutionTraces DROP COLUMN ProvenanceCorrelationId;
GO
