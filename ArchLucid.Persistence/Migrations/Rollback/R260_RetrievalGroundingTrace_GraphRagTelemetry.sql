/*
  R260: Rollback 260_RetrievalGroundingTrace_GraphRagTelemetry.sql — drop the Graph-RAG
  retrieval quality telemetry columns added to dbo.RetrievalGroundingTrace (V1 §2.20).
*/

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'GraphRagExpansionLatencyMs') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN GraphRagExpansionLatencyMs;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'GraphRagSeedHits') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN GraphRagSeedHits;
GO

IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'GraphRagNeighborsAdded') IS NOT NULL
    ALTER TABLE dbo.RetrievalGroundingTrace DROP COLUMN GraphRagNeighborsAdded;
GO
