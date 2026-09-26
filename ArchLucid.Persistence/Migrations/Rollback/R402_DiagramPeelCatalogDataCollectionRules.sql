/*
  R402: Remove the Data Collection Rules row introduced by migration 402.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogEntry
    WHERE ArmResourceType = N'Microsoft.Insights/dataCollectionRules'
      AND Notes = N'Always dispose — data collection rule';
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion = 5)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (4);
END;
GO
