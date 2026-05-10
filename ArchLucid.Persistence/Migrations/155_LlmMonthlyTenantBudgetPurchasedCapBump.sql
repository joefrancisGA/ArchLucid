/*
  155: TB-014 — purchased monthly LLM hard-cap bump per tenant/UTC month (SQL-backed; Stripe wiring follows).

  Idempotent ALTER when column is missing (parity with Scripts/ArchLucid.sql greenfield CREATE).
*/

SET XACT_ABORT ON;
GO

IF COL_LENGTH(N'dbo.LlmMonthlyTenantBudgetState', N'PurchasedCapBumpUsd') IS NULL
BEGIN
    ALTER TABLE dbo.LlmMonthlyTenantBudgetState
        ADD PurchasedCapBumpUsd DECIMAL(18, 6) NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_PurchasedCapBumpUsd DEFAULT (0);
END;
GO
