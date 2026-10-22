/*
  R171: Undo PolicyPackCatalogEntry table creation.
*/

IF OBJECT_ID(N'dbo.PolicyPackCatalogEntry', N'U') IS NOT NULL
    DROP TABLE dbo.PolicyPackCatalogEntry;
GO
