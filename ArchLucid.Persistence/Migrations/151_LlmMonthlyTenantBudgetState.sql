/*
  151: Durable per-tenant UTC-month estimated LLM spend (multi-replica safe via rowversion).

  Idempotent: CREATE TABLE only when missing (parity with Scripts/ArchLucid.sql).
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmMonthlyTenantBudgetState
    (
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        UtcYear           INT              NOT NULL,
        UtcMonth          INT              NOT NULL,
        SpentUsd          DECIMAL(18, 4)   NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_SpentUsd DEFAULT (0),
        WarnedApproaching BIT              NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_Warned DEFAULT (0),
        LastUpdatedUtc    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_Lku DEFAULT SYSUTCDATETIME(),
        RowVersion        ROWVERSION       NOT NULL,
        CONSTRAINT PK_LlmMonthlyTenantBudgetState PRIMARY KEY CLUSTERED (TenantId, UtcYear, UtcMonth),
        CONSTRAINT CK_LlmMonthlyTenantBudgetState_Month CHECK (UtcMonth >= 1 AND UtcMonth <= 12),
        CONSTRAINT CK_LlmMonthlyTenantBudgetState_Year CHECK (UtcYear >= 2000 AND UtcYear <= 2100),
        CONSTRAINT CK_LlmMonthlyTenantBudgetState_SpentNonNegative CHECK (SpentUsd >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_LlmMonthlyTenantBudgetState_LastUpdatedUtc
        ON dbo.LlmMonthlyTenantBudgetState (LastUpdatedUtc DESC);
END;
GO
