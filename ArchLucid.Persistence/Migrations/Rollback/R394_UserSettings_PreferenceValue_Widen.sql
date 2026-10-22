/*
  R394: Rollback 394_UserSettings_PreferenceValue_Widen.sql — revert dbo.UserSettings.PreferenceValue to NVARCHAR(512).

  Fails when any row exceeds 512 code units; truncate or migrate data before rollback in that case.
*/

IF OBJECT_ID(N'dbo.UserSettings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.UserSettings', N'PreferenceValue') = -1
BEGIN
    ALTER TABLE dbo.UserSettings
        ALTER COLUMN PreferenceValue NVARCHAR(512) NOT NULL;
END;
GO
