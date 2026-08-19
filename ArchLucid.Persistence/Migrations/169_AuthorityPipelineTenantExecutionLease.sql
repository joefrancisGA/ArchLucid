/*
 169: dbo.AuthorityPipelineTenantExecutionLease — bounded concurrent authority heavy-stage executions per tenant.
         Intentionally no FK to dbo.Runs: inline pipeline may lease before the run header outer transaction commits.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.AuthorityPipelineTenantExecutionLease', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthorityPipelineTenantExecutionLease
    (
        RunId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuthorityPipelineTenantExecutionLease PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        AcquiredUtc DATETIME2 NOT NULL CONSTRAINT DF_AuthorityPipelineTenantExecutionLease_AcquiredUtc DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_AuthorityPipelineTenantExecutionLease_TenantId_AcquiredUtc
        ON dbo.AuthorityPipelineTenantExecutionLease (TenantId, AcquiredUtc);
END;
GO
