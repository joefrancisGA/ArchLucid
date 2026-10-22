/*
  154: Pre-call reservation columns for durable LLM budgets (INV-004 reserve/settle across replicas).

  Idempotent ALTER when columns are missing (parity with Scripts/ArchLucid.sql greenfield CREATE).
*/

SET XACT_ABORT ON;
GO

IF COL_LENGTH(N'dbo.LlmDailyTenantTokenWindowState', N'ReservedAssumedTokens') IS NULL
BEGIN
    ALTER TABLE dbo.LlmDailyTenantTokenWindowState
        ADD ReservedAssumedTokens BIGINT NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_ReservedAssumedTokens DEFAULT (0);
END;
GO

IF COL_LENGTH(N'dbo.LlmMonthlyTenantBudgetState', N'ReservedAssumedUsd') IS NULL
BEGIN
    ALTER TABLE dbo.LlmMonthlyTenantBudgetState
        ADD ReservedAssumedUsd DECIMAL(18, 4) NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_ReservedAssumedUsd DEFAULT (0);
END;
GO
