/*
  TB-036 — stable provenance ↔ agent trace correlation key on dbo.AgentExecutionTraces.
*/

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ProvenanceCorrelationId') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ProvenanceCorrelationId NVARCHAR(260) NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AgentExecutionTraces_ProvenanceCorrelationId'
          AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
        CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_ProvenanceCorrelationId
            ON dbo.AgentExecutionTraces (ProvenanceCorrelationId)
            WHERE ProvenanceCorrelationId IS NOT NULL;
END;
GO
