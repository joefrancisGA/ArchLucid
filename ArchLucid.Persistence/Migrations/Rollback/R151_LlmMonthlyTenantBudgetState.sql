/*
  Roll back DbUp 151 — dbo.LlmMonthlyTenantBudgetState (per-tenant UTC-month LLM spend totals).
*/

IF OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetState', N'U') IS NOT NULL
    DROP TABLE dbo.LlmMonthlyTenantBudgetState;
GO
