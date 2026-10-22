-- Isolated UTC-day token pool for LLM-as-judge completions (TB-190 / PQ-AI-02).

IF OBJECT_ID(N'dbo.LlmJudgeDailyTenantTokenWindowState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmJudgeDailyTenantTokenWindowState
    (
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        UtcDay                 DATE             NOT NULL,
        TotalTokens            BIGINT           NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_Tokens DEFAULT (0),
        ReservedAssumedTokens  BIGINT           NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_ReservedAssumedTokens DEFAULT (0),
        WarnedApproaching      BIT              NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_Warned DEFAULT (0),
        LastUpdatedUtc         DATETIME2(7)     NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_Lku DEFAULT SYSUTCDATETIME(),
        RowVersion             ROWVERSION       NOT NULL,
        CONSTRAINT PK_LlmJudgeDailyTenantTokenWindowState PRIMARY KEY CLUSTERED (TenantId, UtcDay),
        CONSTRAINT CK_LlmJudgeDailyTenantTokenWindowState_TokensNonNegative CHECK (TotalTokens >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_LlmJudgeDailyTenantTokenWindowState_LastUpdatedUtc
        ON dbo.LlmJudgeDailyTenantTokenWindowState (LastUpdatedUtc DESC);
END;
GO
