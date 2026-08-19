/*
  270: Per-tenant AI budget policy overrides.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.TenantAiBudgetPolicy', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantAiBudgetPolicy
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantAiBudgetPolicy PRIMARY KEY,
        BudgetAmountUsd         DECIMAL(18, 4)   NULL,
        HardStopEnabled         BIT              NOT NULL CONSTRAINT DF_TenantAiBudgetPolicy_HardStop DEFAULT (1),
        AllowCustomerAiProvider BIT              NOT NULL CONSTRAINT DF_TenantAiBudgetPolicy_CustomerProvider DEFAULT (0),
        TrialExpirationUtc      DATETIMEOFFSET   NULL,
        LastUpdatedUtc          DATETIME2(7)     NOT NULL CONSTRAINT DF_TenantAiBudgetPolicy_Lku DEFAULT SYSUTCDATETIME()
    );
END;
GO
