-- TB-XXXX: make Stripe payment-intent wallet credits database-idempotent under concurrent delivery.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_LlmTenantWalletLedger_StripePaymentIntentId'
      AND object_id = OBJECT_ID(N'dbo.LlmTenantWalletLedger'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_LlmTenantWalletLedger_StripePaymentIntentId
        ON dbo.LlmTenantWalletLedger (StripePaymentIntentId)
        WHERE StripePaymentIntentId IS NOT NULL;
END;
GO
