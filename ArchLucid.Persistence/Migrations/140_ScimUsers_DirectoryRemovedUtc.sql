-- SCIM: distinguish DELETE (removed from directory / GET 404) from PATCH active=false (resource still retrievable).

IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ScimUsers', N'DirectoryRemovedUtc') IS NULL
    ALTER TABLE dbo.ScimUsers ADD DirectoryRemovedUtc DATETIME2(7) NULL;
GO
