/*
  278: Tenant-scoped support problem reports (TB-788).

  RLS: not applied — tenant scope enforced in application services and repositories.
*/
IF OBJECT_ID(N'dbo.SupportProblemReports', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SupportProblemReports
    (
        Id                    UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_SupportProblemReports PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ProjectId             UNIQUEIDENTIFIER NULL,
        SubmittedByActorId    NVARCHAR(256)    NOT NULL,
        ContextJson           NVARCHAR(MAX)    NOT NULL,
        OperatorNote          NVARCHAR(2000)   NULL,
        CorrelationId         NVARCHAR(128)    NULL,
        ClientRequestId       NVARCHAR(128)    NULL,
        SupportBundleBlobPath NVARCHAR(1024)   NULL,
        Status                NVARCHAR(16)     NOT NULL,
        CreatedUtc            DATETIME2(7)     NOT NULL
            CONSTRAINT DF_SupportProblemReports_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_SupportProblemReports_Status CHECK (Status IN (N'Open', N'Closed'))
    );

    CREATE INDEX IX_SupportProblemReports_Tenant_Created
        ON dbo.SupportProblemReports (TenantId, CreatedUtc DESC);
END;
GO
