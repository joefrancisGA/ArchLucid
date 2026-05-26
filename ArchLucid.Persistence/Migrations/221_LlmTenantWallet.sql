/*
  221: TB-014 — non-expiring LLM prepaid wallet (balance, auto-replenish, ledger, Stripe webhook idempotency).
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.LlmTenantWalletState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmTenantWalletState
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        BalanceUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_BalanceUsd DEFAULT (0),
        AutoReplenishEnabled BIT NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_AutoReplenishEnabled DEFAULT (0),
        RefillIncrementUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_RefillIncrementUsd DEFAULT (50.00),
        RefillTriggerThresholdUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_RefillTriggerThresholdUsd DEFAULT (10.00),
        MonthlyCapUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_MonthlyCapUsd DEFAULT (0),
        AutoRefillsThisUtcMonthCount INT NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_AutoRefillsThisUtcMonthCount DEFAULT (0),
        AutoRefillsThisUtcMonthYearMonth INT NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_AutoRefillsThisUtcMonthYearMonth DEFAULT (0),
        LastRefillUtc DATETIME2 NULL,
        StripeCustomerId NVARCHAR(255) NULL,
        StripePaymentMethodId NVARCHAR(255) NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT PK_LlmTenantWalletState PRIMARY KEY CLUSTERED (TenantId)
    );
END;
GO

IF OBJECT_ID(N'dbo.LlmTenantWalletLedger', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmTenantWalletLedger
    (
        LedgerId BIGINT IDENTITY(1, 1) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        EntryType NVARCHAR(32) NOT NULL,
        AmountUsd DECIMAL(10, 2) NOT NULL,
        BalanceAfterUsd DECIMAL(10, 2) NOT NULL,
        StripePaymentIntentId NVARCHAR(255) NULL,
        CorrelationId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL
            CONSTRAINT DF_LlmTenantWalletLedger_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_LlmTenantWalletLedger PRIMARY KEY CLUSTERED (LedgerId),
        CONSTRAINT FK_LlmTenantWalletLedger_State FOREIGN KEY (TenantId)
            REFERENCES dbo.LlmTenantWalletState (TenantId)
    );

    CREATE NONCLUSTERED INDEX IX_LlmTenantWalletLedger_TenantId_CreatedUtc
        ON dbo.LlmTenantWalletLedger (TenantId, CreatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.StripeWebhookIdempotency', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StripeWebhookIdempotency
    (
        StripeEventId NVARCHAR(255) NOT NULL,
        EventType NVARCHAR(128) NOT NULL,
        ProcessedUtc DATETIME2 NOT NULL
            CONSTRAINT DF_StripeWebhookIdempotency_ProcessedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_StripeWebhookIdempotency PRIMARY KEY CLUSTERED (StripeEventId)
    );
END;
GO
