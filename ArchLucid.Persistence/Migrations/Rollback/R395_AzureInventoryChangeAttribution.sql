/*
  R395: Remove the change-attribution columns introduced by migration 395.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryChanges', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AzureInventoryChanges', N'ChangedByDisplayName') IS NOT NULL
        ALTER TABLE dbo.AzureInventoryChanges DROP COLUMN ChangedByDisplayName;

    IF COL_LENGTH(N'dbo.AzureInventoryChanges', N'ChangedByKind') IS NOT NULL
        ALTER TABLE dbo.AzureInventoryChanges DROP COLUMN ChangedByKind;
END;
GO
