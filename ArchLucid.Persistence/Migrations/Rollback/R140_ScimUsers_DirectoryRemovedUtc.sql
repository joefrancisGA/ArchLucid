/*
  Roll back DbUp 140 — dbo.ScimUsers.DirectoryRemovedUtc.
*/

IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ScimUsers', N'DirectoryRemovedUtc') IS NOT NULL
    ALTER TABLE dbo.ScimUsers DROP COLUMN DirectoryRemovedUtc;
GO
