/*
  R302: Rollback 302_GoldenManifests_ContractManifestVersion.sql —
  drop typed ContractManifestVersion index + column from dbo.GoldenManifests.
*/

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
         AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
BEGIN
    DROP INDEX IX_GoldenManifests_Scope_ContractManifestVersion ON dbo.GoldenManifests;
END
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ContractManifestVersion') IS NOT NULL
    ALTER TABLE dbo.GoldenManifests DROP COLUMN ContractManifestVersion;
GO
