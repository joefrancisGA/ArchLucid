/*
  System-plane 002: database routing + provisioning queue (control plane only).
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.TenantDatabaseBindings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantDatabaseBindings
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantDatabaseBindings PRIMARY KEY,
        SqlLogicalDatabaseName  NVARCHAR(128)    NOT NULL,
        ProvisioningState       TINYINT          NOT NULL CONSTRAINT DF_TenantDatabaseBindings_State DEFAULT (0),
        LastError               NVARCHAR(4000)   NULL,
        CreatedUtc              DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantDatabaseBindings_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc              DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantDatabaseBindings_Updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_TenantDatabaseBindings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_TenantDatabaseBindings_ProvisioningState
        ON dbo.TenantDatabaseBindings (ProvisioningState)
        INCLUDE (SqlLogicalDatabaseName, UpdatedUtc);
END;
GO

IF OBJECT_ID(N'dbo.TenantDatabaseProvisioningJobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantDatabaseProvisioningJobs
    (
        JobId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_TenantDatabaseProvisioningJobs_Job DEFAULT NEWSEQUENTIALID(),
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_TenantDatabaseProvisioningJobs PRIMARY KEY (JobId),
        AttemptCount   INT              NOT NULL CONSTRAINT DF_TenantDatabaseProvisioningJobs_Attempts DEFAULT (0),
        LastAttemptUtc DATETIMEOFFSET   NULL,
        CorrelationId  NVARCHAR(200)    NULL,
        CONSTRAINT FK_TenantDatabaseProvisioningJobs_Bindings FOREIGN KEY (TenantId) REFERENCES dbo.TenantDatabaseBindings (TenantId)
    );

    CREATE NONCLUSTERED INDEX IX_TenantDatabaseProvisioningJobs_TenantId
        ON dbo.TenantDatabaseProvisioningJobs (TenantId);
END;
GO
