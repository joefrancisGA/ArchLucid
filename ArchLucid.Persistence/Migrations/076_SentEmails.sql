/*
  076: Transactional email idempotency ledger (trial lifecycle + future product mail).
*/
IF OBJECT_ID(N'dbo.SentEmails', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SentEmails
    (
        IdempotencyKey     NVARCHAR(450)    NOT NULL CONSTRAINT PK_SentEmails PRIMARY KEY,
        TenantId           UNIQUEIDENTIFIER NOT NULL,
        TemplateId         NVARCHAR(128)    NOT NULL,
        SentUtc            DATETIMEOFFSET   NOT NULL CONSTRAINT DF_SentEmails_SentUtc DEFAULT SYSUTCDATETIME(),
        Provider           NVARCHAR(64)     NOT NULL,
        ProviderMessageId  NVARCHAR(256)    NULL
    );

    CREATE NONCLUSTERED INDEX IX_SentEmails_TenantTemplate
        ON dbo.SentEmails (TenantId, TemplateId);
END;
GO
