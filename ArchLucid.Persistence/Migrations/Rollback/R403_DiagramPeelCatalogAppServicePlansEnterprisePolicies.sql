/*
  R403: Remove App Service Plan and Enterprise Policy rows introduced by migration 403.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogEntry
    WHERE ArmResourceType IN
    (
        N'Microsoft.Network/enterprisePolicies',
        N'Microsoft.Web/serverFarms'
    )
    AND Notes IN
    (
        N'Always dispose — enterprise policy',
        N'Always dispose — App Service Plan'
    );
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion = 6)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (5);
END;
GO
