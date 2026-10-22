/*
  Roll back DbUp 155 — remove PurchasedCapBumpUsd from dbo.LlmMonthlyTenantBudgetState.
*/

IF COL_LENGTH(N'dbo.LlmMonthlyTenantBudgetState', N'PurchasedCapBumpUsd') IS NOT NULL
BEGIN
    ALTER TABLE dbo.LlmMonthlyTenantBudgetState DROP CONSTRAINT IF EXISTS DF_LlmMonthlyTenantBudgetState_PurchasedCapBumpUsd;
    ALTER TABLE dbo.LlmMonthlyTenantBudgetState DROP COLUMN PurchasedCapBumpUsd;
END;
GO
