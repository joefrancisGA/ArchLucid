/*
  R396: Remove the Data Factory and Synapse backbone rows introduced by migration 396.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogEntry
    WHERE ArmResourceType IN
    (
        N'Microsoft.DataFactory/factories',
        N'Microsoft.Synapse/workspaces'
    )
    AND Notes = N'Backbone — never peel';
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion = 4)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (3);
END;
GO
