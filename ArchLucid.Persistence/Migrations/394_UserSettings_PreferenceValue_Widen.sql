SET NOCOUNT ON;
GO

SET XACT_ABORT ON;
GO

/*
  394: Widen dbo.UserSettings.PreferenceValue NVARCHAR(512) -> NVARCHAR(MAX).

        IH-066 Working workspace continuity stores JSON for up to 20 pins and 8 recents; a modest
        payload already exceeds 512 code units and surfaces as SQL error 2628, mapped to HTTP 503.

        Idempotent: skips when column is already NVARCHAR(MAX).
*/

IF OBJECT_ID(N'dbo.UserSettings', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns AS c
       INNER JOIN sys.types AS t ON c.user_type_id = t.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.UserSettings')
         AND c.name = N'PreferenceValue'
         AND t.name = N'nvarchar'
         AND c.max_length > 0
         AND c.max_length <= 1024)
BEGIN
    ALTER TABLE dbo.UserSettings
        ALTER COLUMN PreferenceValue NVARCHAR(MAX) NOT NULL;
END;
GO
