/*
  410: SecureNow collection agent schedule reported by the run manifest.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.SecureNowCollectionRuns', N'Schedule') IS NULL
BEGIN
    ALTER TABLE dbo.SecureNowCollectionRuns
        ADD Schedule NVARCHAR(512) NULL;
END;
GO
