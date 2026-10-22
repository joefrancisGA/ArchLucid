/*
  104: Per-finding thumbs feedback (operator instrumentation).

  RLS: triple scope (TenantId, WorkspaceId, ProjectId), same pattern as ProductFeedback.
*/

IF OBJECT_ID(N'dbo.FindingFeedback', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingFeedback
    (
        FeedbackId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FindingFeedback PRIMARY KEY,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId  UNIQUEIDENTIFIER NOT NULL,
        ProjectId    UNIQUEIDENTIFIER NOT NULL,
        RunId        UNIQUEIDENTIFIER NOT NULL,
        FindingId    NVARCHAR(32)     NOT NULL,
        Score        SMALLINT         NOT NULL,
        CreatedUtc   DATETIME2(7)     NOT NULL CONSTRAINT DF_FindingFeedback_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_FindingFeedback_Score CHECK (Score IN (-1, 1)),
        CONSTRAINT FK_FindingFeedback_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_FindingFeedback_Tenant_CreatedUtc
        ON dbo.FindingFeedback (TenantId, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_FindingFeedback_Tenant_Run_Finding
        ON dbo.FindingFeedback (TenantId, RunId, FindingId);
END;
GO

