/*
  R254: Rollback 254_UserSettings.sql — remove per-user preference key/value table.
*/

IF OBJECT_ID(N'dbo.UserSettings', N'U') IS NOT NULL
    DROP TABLE dbo.UserSettings;
GO
