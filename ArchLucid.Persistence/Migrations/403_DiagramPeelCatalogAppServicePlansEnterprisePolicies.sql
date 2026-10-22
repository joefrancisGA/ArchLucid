/*
  Add App Service Plans and Enterprise Policies to the database-backed
  never-show catalog.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    MERGE dbo.DiagramPeelCatalogEntry AS target
    USING (VALUES
        (N'Microsoft.Network/enterprisePolicies', N'Always dispose — enterprise policy'),
        (N'Microsoft.Web/serverFarms', N'Always dispose — App Service Plan')
    ) AS source (ArmResourceType, Notes)
        ON target.ArmResourceType = source.ArmResourceType
    WHEN MATCHED THEN
        UPDATE SET
            PeelRank = 0,
            AlwaysDispose = 1,
            IsEnabled = 1,
            Notes = source.Notes,
            UpdatedUtc = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (ArmResourceType, PeelRank, AlwaysDispose, IsEnabled, Notes)
        VALUES (source.ArmResourceType, 0, 1, 1, source.Notes);
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion < 6)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (6);
END;
GO
