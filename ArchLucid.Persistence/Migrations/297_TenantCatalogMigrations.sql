/*
  297: Tenant catalog migration fan-out state (TB-2045–TB-2047).
*/
IF OBJECT_ID(N'dbo.TenantCatalogMigrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantCatalogMigrations
    (
        MigrationId            UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_TenantCatalogMigrations_MigrationId DEFAULT NEWSEQUENTIALID(),
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        CorrelationId          NVARCHAR(128)    NOT NULL,
        Stage                  NVARCHAR(64)     NOT NULL,
        StartedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantCatalogMigrations_StartedUtc DEFAULT SYSUTCDATETIME(),
        CompletedUtc           DATETIME2(7)     NULL,
        MaintenanceMessage     NVARCHAR(1000)   NOT NULL,
        VerificationPassedUtc  DATETIME2(7)     NULL,
        LastVerificationError  NVARCHAR(2000)   NULL,
        CONSTRAINT PK_TenantCatalogMigrations PRIMARY KEY (MigrationId)
    );

    CREATE UNIQUE INDEX UX_TenantCatalogMigrations_Tenant_Active
        ON dbo.TenantCatalogMigrations (TenantId)
        WHERE CompletedUtc IS NULL;
END;
GO
