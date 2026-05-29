-- RAG-V1-006 / TB-038: forensic enrichment for retrieval grounding traces (Batch A).

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'QueryText') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD QueryText NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'TopK') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD TopK INT NULL;

    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'CorpusKind') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD CorpusKind NVARCHAR(64) NULL;

    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'ScoresJson') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD ScoresJson NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'DocumentIdsJson') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD DocumentIdsJson NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'AgentExecutionTraceId') IS NULL
        ALTER TABLE dbo.RetrievalGroundingTrace ADD AgentExecutionTraceId NVARCHAR(64) NULL;
END;
GO
