/*
  IE-17 peel budget: product catalog of ARM types that may be hidden (in rank order) when an
  inventory diagram exceeds readability thresholds. Global read-only — not tenant-scoped.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DiagramPeelCatalogVersion
    (
        CatalogVersion INT NOT NULL CONSTRAINT PK_DiagramPeelCatalogVersion PRIMARY KEY,
        UpdatedUtc     DATETIME2(7) NOT NULL CONSTRAINT DF_DiagramPeelCatalogVersion_UpdatedUtc DEFAULT SYSUTCDATETIME()
    );

    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (1);
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DiagramPeelCatalogEntry
    (
        ArmResourceType NVARCHAR(256) NOT NULL CONSTRAINT PK_DiagramPeelCatalogEntry PRIMARY KEY,
        PeelRank        INT NULL,
        IsEnabled       BIT NOT NULL CONSTRAINT DF_DiagramPeelCatalogEntry_IsEnabled DEFAULT (1),
        Notes           NVARCHAR(512) NOT NULL CONSTRAINT DF_DiagramPeelCatalogEntry_Notes DEFAULT (N''),
        UpdatedUtc      DATETIME2(7) NOT NULL CONSTRAINT DF_DiagramPeelCatalogEntry_UpdatedUtc DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_DiagramPeelCatalogEntry_PeelRank
        ON dbo.DiagramPeelCatalogEntry (PeelRank, ArmResourceType)
        WHERE PeelRank IS NOT NULL AND IsEnabled = 1;
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogEntry WHERE ArmResourceType = N'Microsoft.Network/networkWatchers')
BEGIN
    INSERT INTO dbo.DiagramPeelCatalogEntry (ArmResourceType, PeelRank, Notes)
    VALUES
        (N'Microsoft.Network/networkWatchers', 10, N'Platform noise — not topology'),
        (N'Microsoft.Insights/diagnosticSettings', 10, N'Observability attachment'),
        (N'Microsoft.Resources/deployments', 10, N'Deployment history'),
        (N'Microsoft.Authorization/locks', 10, N'Governance metadata'),
        (N'Microsoft.Network/virtualNetworks/subnets', 20, N'Child resource — nest under VNet swimlane'),
        (N'Microsoft.Network/networkSecurityGroups/securityRules', 20, N'Child resource — rules on NSG'),
        (N'Microsoft.Network/routeTables/routes', 20, N'Child resource — routes on table'),
        (N'Microsoft.Network/loadBalancers/backendAddressPools', 20, N'Child resource — LB pool'),
        (N'Microsoft.Network/loadBalancers/probes', 20, N'Child resource — LB probe'),
        (N'Microsoft.Network/applicationGateways/frontendIPConfigurations', 20, N'Child resource — AppGw frontend'),
        (N'Microsoft.Storage/storageAccounts/blobServices', 20, N'Child resource — storage sub-service'),
        (N'Microsoft.Compute/virtualMachines/extensions', 20, N'Child resource — VM extension'),
        (N'Microsoft.Network/networkInterfaces', 30, N'Attachment — VM/NIC hop'),
        (N'Microsoft.Network/publicIPAddresses', 40, N'Attachment — address on NIC/LB'),
        (N'Microsoft.Compute/disks', 50, N'Attachment — disk on VM');
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogEntry WHERE ArmResourceType = N'Microsoft.Network/virtualNetworks' AND PeelRank IS NULL)
BEGIN
    INSERT INTO dbo.DiagramPeelCatalogEntry (ArmResourceType, PeelRank, Notes)
    VALUES
        (N'Microsoft.Network/virtualNetworks', NULL, N'Backbone — never peel'),
        (N'Microsoft.Compute/virtualMachines', NULL, N'Backbone — never peel'),
        (N'Microsoft.Web/sites', NULL, N'Backbone — never peel'),
        (N'Microsoft.Storage/storageAccounts', NULL, N'Backbone — never peel'),
        (N'Microsoft.Sql/servers', NULL, N'Backbone — never peel'),
        (N'Microsoft.ManagedIdentity/userAssignedIdentities', NULL, N'Backbone — never peel'),
        (N'Microsoft.Network/azureFirewalls', NULL, N'Backbone — never peel'),
        (N'Microsoft.Network/applicationGateways', NULL, N'Backbone — never peel'),
        (N'Microsoft.Network/loadBalancers', NULL, N'Backbone — never peel'),
        (N'Microsoft.Network/privateEndpoints', NULL, N'Backbone — never peel');
END;
GO
