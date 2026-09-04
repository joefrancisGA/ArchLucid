/*
  Rollback 348: drop infrastructure-evidence diff and advisory Terraform mapping tables.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AdvisoryTerraformResourceMappings', N'U') IS NOT NULL
    DROP TABLE dbo.AdvisoryTerraformResourceMappings;
GO

IF OBJECT_ID(N'dbo.AzureInventoryChanges', N'U') IS NOT NULL
    DROP TABLE dbo.AzureInventoryChanges;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDiffs', N'U') IS NOT NULL
    DROP TABLE dbo.AzureInventoryDiffs;
GO
