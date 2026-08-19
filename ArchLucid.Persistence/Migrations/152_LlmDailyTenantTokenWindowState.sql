-- Durable per-tenant UTC-day LLM token totals (multi-replica budget; see LlmDailyTenantBudgetTracker).

IF OBJECT_ID(N'dbo.LlmDailyTenantTokenWindowState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmDailyTenantTokenWindowState
    (
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        UtcDay            DATE             NOT NULL,
        TotalTokens       BIGINT           NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_Tokens DEFAULT (0),
        WarnedApproaching BIT              NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_Warned DEFAULT (0),
        LastUpdatedUtc    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_Lku DEFAULT SYSUTCDATETIME(),
        RowVersion        ROWVERSION       NOT NULL,
        CONSTRAINT PK_LlmDailyTenantTokenWindowState PRIMARY KEY CLUSTERED (TenantId, UtcDay),
        CONSTRAINT CK_LlmDailyTenantTokenWindowState_TokensNonNegative CHECK (TotalTokens >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_LlmDailyTenantTokenWindowState_LastUpdatedUtc
        ON dbo.LlmDailyTenantTokenWindowState (LastUpdatedUtc DESC);
END;
GO
