/*
  R221: Rollback 221_LlmTenantWallet.sql — drop LLM wallet state, ledger, and Stripe webhook idempotency tables.
*/

IF OBJECT_ID(N'dbo.LlmTenantWalletLedger', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.LlmTenantWalletLedger;
END;
GO

IF OBJECT_ID(N'dbo.LlmTenantWalletState', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.LlmTenantWalletState;
END;
GO

IF OBJECT_ID(N'dbo.StripeWebhookIdempotency', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.StripeWebhookIdempotency;
END;
GO
