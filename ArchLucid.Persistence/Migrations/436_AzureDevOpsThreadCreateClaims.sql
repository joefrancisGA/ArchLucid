/* Append-only thread-create claims. Existence does not confirm that the remote thread was created. */
IF OBJECT_ID(N'dbo.AzureDevOpsThreadCreateClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureDevOpsThreadCreateClaims
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        RepositoryId UNIQUEIDENTIFIER NOT NULL,
        PullRequestId INT NOT NULL,
        ClaimedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_AzureDevOpsThreadCreateClaims_ClaimedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AzureDevOpsThreadCreateClaims PRIMARY KEY (TenantId, RunId, RepositoryId, PullRequestId),
        CONSTRAINT CK_AzureDevOpsThreadCreateClaims_PullRequestId CHECK (PullRequestId > 0)
    );
END;
GO
