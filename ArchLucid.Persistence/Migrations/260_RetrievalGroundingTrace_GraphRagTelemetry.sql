-- Graph-RAG retrieval quality telemetry on persisted grounding traces (V1 §2.20).

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'GraphRagNeighborsAdded') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD GraphRagNeighborsAdded INT NULL;

    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'GraphRagSeedHits') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD GraphRagSeedHits INT NULL;

    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'GraphRagExpansionLatencyMs') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD GraphRagExpansionLatencyMs FLOAT NULL;
END;
