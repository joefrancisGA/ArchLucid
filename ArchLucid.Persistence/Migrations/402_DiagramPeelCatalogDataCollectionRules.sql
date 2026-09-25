/*
  Add Azure Data Collection Rules to the database-backed never-show catalog.
  These resources are inventory implementation detail and should not appear
  in resource lists or infrastructure diagrams.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    MERGE dbo.DiagramPeelCatalogEntry AS target
    USING (VALUES
        (N'Microsoft.Insights/dataCollectionRules', N'Always dispose — data collection rule')
    ) AS source (ArmResourceType, Notes)
        ON target.ArmResourceType = source.ArmResourceType
    WHEN MATCHED THEN
        UPDATE SET
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
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion < 5)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (5);
END;
GO
