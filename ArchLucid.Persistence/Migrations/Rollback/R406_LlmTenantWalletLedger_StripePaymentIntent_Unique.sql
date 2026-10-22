/*
  R406: Rollback 406_LlmTenantWalletLedger_StripePaymentIntent_Unique.sql.
*/
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_LlmTenantWalletLedger_StripePaymentIntentId'
      AND object_id = OBJECT_ID(N'dbo.LlmTenantWalletLedger'))
BEGIN
    DROP INDEX UX_LlmTenantWalletLedger_StripePaymentIntentId
        ON dbo.LlmTenantWalletLedger;
END;
GO
