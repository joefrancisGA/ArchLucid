/*
  Rollback 346: drop infrastructure-evidence foundation tables.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.TenantBrandingProfiles', N'U') IS NOT NULL DROP TABLE dbo.TenantBrandingProfiles;
GO
IF OBJECT_ID(N'dbo.AuditControlMetadata', N'U') IS NOT NULL DROP TABLE dbo.AuditControlMetadata;
GO
IF OBJECT_ID(N'dbo.AuditControls', N'U') IS NOT NULL DROP TABLE dbo.AuditControls;
GO
IF OBJECT_ID(N'dbo.AuditFrameworks', N'U') IS NOT NULL DROP TABLE dbo.AuditFrameworks;
GO
IF OBJECT_ID(N'dbo.CloudResourceIdentities', N'U') IS NOT NULL DROP TABLE dbo.CloudResourceIdentities;
GO
IF OBJECT_ID(N'dbo.AzureInventoryUnknownResources', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryUnknownResources;
GO
IF OBJECT_ID(N'dbo.AzureInventoryDiagnosticConfigurations', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryDiagnosticConfigurations;
GO
IF OBJECT_ID(N'dbo.AzureInventoryTags', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryTags;
GO
IF OBJECT_ID(N'dbo.AzureInventoryRoleAssignments', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryRoleAssignments;
GO
IF OBJECT_ID(N'dbo.AzureInventoryIdentities', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryIdentities;
GO
IF OBJECT_ID(N'dbo.AzureInventoryResourceRelationships', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryResourceRelationships;
GO
IF OBJECT_ID(N'dbo.AzureInventoryResourceProperties', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryResourceProperties;
GO
IF OBJECT_ID(N'dbo.AzureInventoryResources', N'U') IS NOT NULL DROP TABLE dbo.AzureInventoryResources;
GO
IF OBJECT_ID(N'dbo.AzureInventorySnapshots', N'U') IS NOT NULL DROP TABLE dbo.AzureInventorySnapshots;
GO
