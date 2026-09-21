/*
  R398: Remove the persisted completeness-warning column introduced by migration 398.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventorySnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AzureInventorySnapshots', N'CompletenessWarningsJson') IS NOT NULL
    ALTER TABLE dbo.AzureInventorySnapshots DROP COLUMN CompletenessWarningsJson;
GO
