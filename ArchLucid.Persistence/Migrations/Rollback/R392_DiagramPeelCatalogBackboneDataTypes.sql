/*
  R392: Remove the backbone product types introduced by migration 392.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogEntry
    WHERE ArmResourceType IN
    (
        N'Microsoft.Sql/servers/databases',
        N'Microsoft.Sql/managedInstances',
        N'Microsoft.DBforPostgreSQL/flexibleServers',
        N'Microsoft.DBforPostgreSQL/servers',
        N'Microsoft.DBforMySQL/flexibleServers',
        N'Microsoft.DBforMySQL/servers',
        N'Microsoft.DocumentDB/databaseAccounts',
        N'Microsoft.Cache/Redis',
        N'Microsoft.Compute/virtualMachineScaleSets',
        N'Microsoft.ContainerService/managedClusters',
        N'Microsoft.Web/serverFarms',
        N'Microsoft.KeyVault/vaults'
    )
    AND Notes = N'Backbone — never peel';
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion = 2)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (1);
END;
GO
