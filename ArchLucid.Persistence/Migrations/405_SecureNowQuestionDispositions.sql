/*
  405: SecureNow question dispositions (SN-QQ-01).
  A disposition is tenant/subscription/resource/question-key scoped,
  independent of the snapshot that last updated it.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowQuestionDispositions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecureNowQuestionDispositions
    (
        DispositionId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecureNowQuestionDispositions PRIMARY KEY CLUSTERED,
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId          UNIQUEIDENTIFIER NOT NULL,
        ProjectId            UNIQUEIDENTIFIER NOT NULL,
        SnapshotId            UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId       NVARCHAR(128)    NOT NULL,
        ResourceId           NVARCHAR(2048)   NOT NULL CONSTRAINT DF_SecureNowQuestionDispositions_ResourceId DEFAULT (N''),
        QuestionKey          NVARCHAR(256)    NOT NULL,
        IdentityHashSha256   VARBINARY(32)    NOT NULL,
        Source               INT              NOT NULL,
        ScopeKind            INT              NOT NULL,
        Status               INT              NOT NULL,
        AnswerCode           NVARCHAR(128)    NULL,
        AnswerText           NVARCHAR(4000)   NULL,
        Reason               NVARCHAR(4000)   NOT NULL,
        ExpirationUtc        DATETIME2        NOT NULL,
        EvidenceFingerprint  NVARCHAR(512)    NOT NULL,
        ActorKey             NVARCHAR(256)    NOT NULL,
        UpdatedUtc           DATETIME2        NOT NULL,
        AuditEntriesJson     NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_SecureNowQuestionDispositions_AuditEntries DEFAULT (N'[]')
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_SecureNowQuestionDispositions_Identity
        ON dbo.SecureNowQuestionDispositions (TenantId, IdentityHashSha256);

    CREATE NONCLUSTERED INDEX IX_SecureNowQuestionDispositions_Tenant_Subscription
        ON dbo.SecureNowQuestionDispositions (TenantId, SubscriptionId, UpdatedUtc DESC);
END;
GO
