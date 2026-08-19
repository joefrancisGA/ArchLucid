/*
  R261: Rollback 261_CloudInventoryExtractorPackages.sql — drop cloud inventory extractor package storage.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.CloudInventoryExtractorPackages', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.CloudInventoryExtractorPackages;
END;
GO
