/*
  Rollback 146: drop Azure extractor package storage.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureExtractorPackages', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureExtractorPackages;
END;
GO
