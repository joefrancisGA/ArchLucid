/*
  Roll back DbUp 154 — remove pre-call reservation columns from LLM budget state tables
  (ReservedAssumedTokens, ReservedAssumedUsd).
*/

IF COL_LENGTH(N'dbo.LlmDailyTenantTokenWindowState', N'ReservedAssumedTokens') IS NOT NULL
BEGIN
    ALTER TABLE dbo.LlmDailyTenantTokenWindowState DROP CONSTRAINT IF EXISTS DF_LlmDailyTenantTokenWindowState_ReservedAssumedTokens;
    ALTER TABLE dbo.LlmDailyTenantTokenWindowState DROP COLUMN ReservedAssumedTokens;
END;
GO

IF COL_LENGTH(N'dbo.LlmMonthlyTenantBudgetState', N'ReservedAssumedUsd') IS NOT NULL
BEGIN
    ALTER TABLE dbo.LlmMonthlyTenantBudgetState DROP CONSTRAINT IF EXISTS DF_LlmMonthlyTenantBudgetState_ReservedAssumedUsd;
    ALTER TABLE dbo.LlmMonthlyTenantBudgetState DROP COLUMN ReservedAssumedUsd;
END;
GO
