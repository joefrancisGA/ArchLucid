/*
  Migration 050: Append-only policy pack change log.

  Records every mutation to policy packs, versions, and assignments.
  The application identity should have INSERT-only permissions on this
  table; UPDATE and DELETE are prohibited by design.

  Idempotent: skips creation when the table exists.
*/

IF OBJECT_ID(N'dbo.PolicyPackChangeLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPackChangeLog
    (
        ChangeLogId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_PolicyPackChangeLog_ChangeLogId DEFAULT NEWSEQUENTIALID(),
        PolicyPackId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ChangeType NVARCHAR(64) NOT NULL,
        ChangedBy NVARCHAR(256) NOT NULL,
        ChangedUtc DATETIME2(7) NOT NULL
            CONSTRAINT DF_PolicyPackChangeLog_ChangedUtc DEFAULT SYSUTCDATETIME(),
        PreviousValue NVARCHAR(MAX) NULL,
        NewValue NVARCHAR(MAX) NULL,
        SummaryText NVARCHAR(512) NULL,
        CONSTRAINT PK_PolicyPackChangeLog
            PRIMARY KEY CLUSTERED (ChangeLogId)
    );

    CREATE NONCLUSTERED INDEX IX_PolicyPackChangeLog_PackId_ChangedUtc
        ON dbo.PolicyPackChangeLog (PolicyPackId, ChangedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_PolicyPackChangeLog_TenantId_ChangedUtc
        ON dbo.PolicyPackChangeLog (TenantId, ChangedUtc DESC);
END;
GO

GO
