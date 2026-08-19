/*
  275: Azure Boards outbound work-item settings + provider check expansion (PAT via Key Vault secret names).

  RLS: not applied — API enforces caller tenant via IScopeContextProvider (same posture as TenantItsmConnectorConnections).
*/
IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_TenantItsmConnectorConnections_Provider'
      AND parent_object_id = OBJECT_ID(N'dbo.TenantItsmConnectorConnections'))
BEGIN
    ALTER TABLE dbo.TenantItsmConnectorConnections
        DROP CONSTRAINT CK_TenantItsmConnectorConnections_Provider;
END;
GO

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_TenantItsmConnectorConnections_Provider2'
      AND parent_object_id = OBJECT_ID(N'dbo.TenantItsmConnectorConnections'))
BEGIN
    ALTER TABLE dbo.TenantItsmConnectorConnections
        DROP CONSTRAINT CK_TenantItsmConnectorConnections_Provider2;
END;
GO

ALTER TABLE dbo.TenantItsmConnectorConnections
    ADD CONSTRAINT CK_TenantItsmConnectorConnections_Provider
        CHECK (Provider IN (N'Jira', N'ServiceNow', N'AzureBoards'));
GO

IF OBJECT_ID(N'dbo.TenantAzureBoardsOutboundSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantAzureBoardsOutboundSettings
    (
        TenantId                   UNIQUEIDENTIFIER NOT NULL,
        ProjectName                NVARCHAR(256)    NOT NULL,
        DefaultWorkItemType        NVARCHAR(128)    NOT NULL,
        AreaPath                   NVARCHAR(500)    NULL,
        IterationPath              NVARCHAR(500)    NULL,
        DefaultTags                NVARCHAR(500)    NULL,
        LastConnectionTestUtc      DATETIME2(7)     NULL,
        LastConnectionTestSummary  NVARCHAR(1000)   NULL,
        CONSTRAINT PK_TenantAzureBoardsOutboundSettings PRIMARY KEY (TenantId),
        CONSTRAINT FK_TenantAzureBoardsOutboundSettings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO
