/*
  R275: Rollback 275_AzureBoardsWorkManagement.sql — drop Azure Boards outbound settings; restore ITSM provider check.
*/

IF OBJECT_ID(N'dbo.TenantAzureBoardsOutboundSettings', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantAzureBoardsOutboundSettings;
END;
GO

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

ALTER TABLE dbo.TenantItsmConnectorConnections
    ADD CONSTRAINT CK_TenantItsmConnectorConnections_Provider
        CHECK (Provider IN (N'Jira', N'ServiceNow'));
GO
