/*
  IE-17 peel catalog v2: keep SQL databases and other backbone product types
  so Full subscription does not hide VMs/databases as implicit children.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogEntry WHERE ArmResourceType = N'Microsoft.Sql/servers/databases')
BEGIN
    INSERT INTO dbo.DiagramPeelCatalogEntry (ArmResourceType, PeelRank, Notes)
    VALUES
        (N'Microsoft.Sql/servers/databases', NULL, N'Backbone — never peel'),
        (N'Microsoft.Sql/managedInstances', NULL, N'Backbone — never peel'),
        (N'Microsoft.DBforPostgreSQL/flexibleServers', NULL, N'Backbone — never peel'),
        (N'Microsoft.DBforPostgreSQL/servers', NULL, N'Backbone — never peel'),
        (N'Microsoft.DBforMySQL/flexibleServers', NULL, N'Backbone — never peel'),
        (N'Microsoft.DBforMySQL/servers', NULL, N'Backbone — never peel'),
        (N'Microsoft.DocumentDB/databaseAccounts', NULL, N'Backbone — never peel'),
        (N'Microsoft.Cache/Redis', NULL, N'Backbone — never peel'),
        (N'Microsoft.Compute/virtualMachineScaleSets', NULL, N'Backbone — never peel'),
        (N'Microsoft.ContainerService/managedClusters', NULL, N'Backbone — never peel'),
        (N'Microsoft.Web/serverFarms', NULL, N'Backbone — never peel'),
        (N'Microsoft.KeyVault/vaults', NULL, N'Backbone — never peel');
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion < 2)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (2);
END;
GO
