/*
  IE-17 peel catalog v3: always-dispose ARM types are hidden on every inventory diagram
  and stored on dbo.DiagramPeelCatalogEntry.AlwaysDispose.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DiagramPeelCatalogEntry', N'AlwaysDispose') IS NULL
BEGIN
    ALTER TABLE dbo.DiagramPeelCatalogEntry
        ADD AlwaysDispose BIT NOT NULL
            CONSTRAINT DF_DiagramPeelCatalogEntry_AlwaysDispose DEFAULT (0);
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DiagramPeelCatalogEntry', N'AlwaysDispose') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_DiagramPeelCatalogEntry_AlwaysDispose'
          AND object_id = OBJECT_ID(N'dbo.DiagramPeelCatalogEntry'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_DiagramPeelCatalogEntry_AlwaysDispose
        ON dbo.DiagramPeelCatalogEntry (ArmResourceType)
        WHERE AlwaysDispose = 1 AND IsEnabled = 1;
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DiagramPeelCatalogEntry', N'AlwaysDispose') IS NOT NULL
BEGIN
    UPDATE dbo.DiagramPeelCatalogEntry
    SET PeelRank = 0,
        AlwaysDispose = 1,
        Notes = N'Always dispose — VM extension',
        UpdatedUtc = SYSUTCDATETIME()
    WHERE ArmResourceType = N'Microsoft.Compute/virtualMachines/extensions';

    MERGE dbo.DiagramPeelCatalogEntry AS target
    USING (VALUES
        (N'Microsoft.Portal/dashboards', N'Always dispose — portal dashboard'),
        (N'Microsoft.Network/dnszones', N'Always dispose — DNS zone'),
        (N'Microsoft.Network/privateDnsZones', N'Always dispose — private DNS zone'),
        (N'Microsoft.Network/dnsResolvers', N'Always dispose — DNS resolver'),
        (N'Microsoft.Compute/virtualMachines/extensions', N'Always dispose — VM extension'),
        (N'Microsoft.Compute/virtualMachineScaleSets/extensions', N'Always dispose — VMSS extension'),
        (N'Microsoft.HybridCompute/machines/extensions', N'Always dispose — Arc extension'),
        (N'Microsoft.Maintenance/maintenanceConfigurations', N'Always dispose — maintenance window'),
        (N'Microsoft.Maintenance/configurationAssignments', N'Always dispose — maintenance assignment')
    ) AS source (ArmResourceType, Notes)
        ON target.ArmResourceType = source.ArmResourceType
    WHEN MATCHED THEN
        UPDATE SET
            PeelRank = 0,
            AlwaysDispose = 1,
            Notes = source.Notes,
            UpdatedUtc = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (ArmResourceType, PeelRank, AlwaysDispose, IsEnabled, Notes)
        VALUES (source.ArmResourceType, 0, 1, 1, source.Notes);
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion < 3)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (3);
END;
GO
