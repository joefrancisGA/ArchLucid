/*
  System-plane 003: warm tenant catalog standby pool (TB-018).
  No FK to dbo.Tenants — standbys are claimed at signup.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.WarmTenantCatalogStandby', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WarmTenantCatalogStandby
    (
        StandbyId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WarmTenantCatalogStandby PRIMARY KEY,
        SqlLogicalDatabaseName  NVARCHAR(128)    NOT NULL,
        SchemaReadyUtc          DATETIMEOFFSET   NOT NULL CONSTRAINT DF_WarmTenantCatalogStandby_SchemaReady DEFAULT (SYSUTCDATETIME()),
        CreatedUtc              DATETIMEOFFSET   NOT NULL CONSTRAINT DF_WarmTenantCatalogStandby_Created DEFAULT (SYSUTCDATETIME()),
        ClaimedUtc              DATETIMEOFFSET   NULL,
        CONSTRAINT UQ_WarmTenantCatalogStandby_DbName UNIQUE (SqlLogicalDatabaseName)
    );

    CREATE NONCLUSTERED INDEX IX_WarmTenantCatalogStandby_Unclaimed
        ON dbo.WarmTenantCatalogStandby (ClaimedUtc, CreatedUtc)
        INCLUDE (SqlLogicalDatabaseName)
        WHERE ClaimedUtc IS NULL;
END;
GO
