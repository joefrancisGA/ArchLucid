/*
  395: Drift change attribution from ARM systemData captured on inventory snapshots.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryChanges', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AzureInventoryChanges', N'ChangedByDisplayName') IS NULL
BEGIN
    ALTER TABLE dbo.AzureInventoryChanges
        ADD ChangedByDisplayName NVARCHAR(512) NULL,
            ChangedByKind NVARCHAR(64) NULL;
END;
GO
