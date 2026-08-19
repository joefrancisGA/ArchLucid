-- RAG-V1-006 / TB-038: retrieval grounding traces + forensic enrichment (Batch A).

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RetrievalGroundingTrace
    (
        TraceId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RetrievalGroundingTrace PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        AgentName NVARCHAR(64) NOT NULL,
        RetrievedChunkIdsJson NVARCHAR(MAX) NOT NULL,
        TokensIn INT NULL,
        TokensOut INT NULL,
        CitationCoverage DECIMAL(5, 4) NOT NULL,
        QueryText NVARCHAR(MAX) NULL,
        TopK INT NULL,
        CorpusKind NVARCHAR(64) NULL,
        ScoresJson NVARCHAR(MAX) NULL,
        DocumentIdsJson NVARCHAR(MAX) NULL,
        AgentExecutionTraceId NVARCHAR(64) NULL,
        CreatedUtc DATETIME2 NOT NULL CONSTRAINT DF_RetrievalGroundingTrace_CreatedUtc DEFAULT (SYSUTCDATETIME())
    );

    CREATE NONCLUSTERED INDEX IX_RetrievalGroundingTrace_RunId
        ON dbo.RetrievalGroundingTrace (RunId, CreatedUtc DESC);
END;
GO

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
