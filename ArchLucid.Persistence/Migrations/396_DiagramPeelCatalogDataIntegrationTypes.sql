/*
  IE-17 peel catalog v4: Data Factory and Synapse are backbone product types.
  Without these rows Full subscription peels them with the attachment noise and the
  Executive always-show tiers cannot surface them.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    MERGE dbo.DiagramPeelCatalogEntry AS target
    USING (VALUES
        (N'Microsoft.DataFactory/factories', N'Backbone — never peel'),
        (N'Microsoft.Synapse/workspaces', N'Backbone — never peel')
    ) AS source (ArmResourceType, Notes)
        ON target.ArmResourceType = source.ArmResourceType
    WHEN NOT MATCHED THEN
        INSERT (ArmResourceType, PeelRank, AlwaysDispose, IsEnabled, Notes)
        VALUES (source.ArmResourceType, NULL, 0, 1, source.Notes);
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion < 4)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (4);
END;
GO
