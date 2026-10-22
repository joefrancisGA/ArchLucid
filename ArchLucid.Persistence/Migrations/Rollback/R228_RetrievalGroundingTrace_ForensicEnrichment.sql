/*
  R228: Rollback 228_RetrievalGroundingTrace_ForensicEnrichment.sql — drop retrieval grounding forensic enrichment columns.
*/

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'AgentExecutionTraceId') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN AgentExecutionTraceId;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'DocumentIdsJson') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN DocumentIdsJson;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'ScoresJson') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN ScoresJson;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'CorpusKind') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN CorpusKind;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'TopK') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN TopK;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'QueryText') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN QueryText;
GO
