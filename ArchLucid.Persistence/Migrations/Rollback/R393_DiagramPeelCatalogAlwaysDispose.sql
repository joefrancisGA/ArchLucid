/*
  R393: Remove the AlwaysDispose index and column introduced by migration 393.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogEntry', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_DiagramPeelCatalogEntry_AlwaysDispose'
          AND object_id = OBJECT_ID(N'dbo.DiagramPeelCatalogEntry')
    )
        DROP INDEX IX_DiagramPeelCatalogEntry_AlwaysDispose
            ON dbo.DiagramPeelCatalogEntry;

    IF COL_LENGTH(N'dbo.DiagramPeelCatalogEntry', N'AlwaysDispose') IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.default_constraints
            WHERE name = N'DF_DiagramPeelCatalogEntry_AlwaysDispose'
              AND parent_object_id = OBJECT_ID(N'dbo.DiagramPeelCatalogEntry')
        )
            ALTER TABLE dbo.DiagramPeelCatalogEntry
                DROP CONSTRAINT DF_DiagramPeelCatalogEntry_AlwaysDispose;

        ALTER TABLE dbo.DiagramPeelCatalogEntry DROP COLUMN AlwaysDispose;
    END;
END;
GO

IF OBJECT_ID(N'dbo.DiagramPeelCatalogVersion', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.DiagramPeelCatalogVersion WHERE CatalogVersion = 3)
BEGIN
    DELETE FROM dbo.DiagramPeelCatalogVersion;
    INSERT INTO dbo.DiagramPeelCatalogVersion (CatalogVersion) VALUES (2);
END;
GO
