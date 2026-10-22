/*
  409: SecureNow collection run records and imported package provenance.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecureNowCollectionRuns', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecureNowCollectionRuns
    (
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId               UNIQUEIDENTIFIER NOT NULL,
        ProjectId                 UNIQUEIDENTIFIER NOT NULL,
        RunId                     UNIQUEIDENTIFIER NOT NULL,
        AgentVersion              NVARCHAR(128)    NOT NULL,
        StartedUtc                DATETIME2        NOT NULL,
        FinishedUtc               DATETIME2        NULL,
        Status                    INT              NOT NULL,
        SubscriptionsCoveredJson  NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_SecureNowCollectionRuns_Subscriptions DEFAULT (N'[]'),
        ErrorSummary              NVARCHAR(4000)   NULL,
        ZipPath                   NVARCHAR(2048)   NULL,
        ZipSha256                 VARBINARY(32)    NULL,
        ImportedSnapshotId        UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_SecureNowCollectionRuns PRIMARY KEY CLUSTERED (TenantId, WorkspaceId, ProjectId, RunId)
    );

    CREATE NONCLUSTERED INDEX IX_SecureNowCollectionRuns_Scope_Started
        ON dbo.SecureNowCollectionRuns (TenantId, WorkspaceId, ProjectId, StartedUtc DESC, RunId DESC);

    CREATE NONCLUSTERED INDEX IX_SecureNowCollectionRuns_Scope_Hash
        ON dbo.SecureNowCollectionRuns (TenantId, WorkspaceId, ProjectId, ZipSha256)
        WHERE ZipSha256 IS NOT NULL;
END;
GO
