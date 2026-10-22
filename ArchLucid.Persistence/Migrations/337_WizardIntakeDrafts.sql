/* 337 — Tenant-persisted wizard intake drafts for cross-session resume (robustness #7). */

IF OBJECT_ID(N'dbo.WizardIntakeDrafts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WizardIntakeDrafts
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        WizardId NVARCHAR(128) NOT NULL,
        StepIndex INT NOT NULL,
        StateJson NVARCHAR(MAX) NOT NULL,
        IdempotencyKeyHash VARBINARY(32) NULL,
        UpdatedUtc DATETIME2(3) NOT NULL CONSTRAINT DF_WizardIntakeDrafts_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_WizardIntakeDrafts PRIMARY KEY (TenantId, WorkspaceId, WizardId),
        CONSTRAINT CK_WizardIntakeDrafts_StateJson CHECK (ISJSON(StateJson) = 1)
    );
END;
GO
