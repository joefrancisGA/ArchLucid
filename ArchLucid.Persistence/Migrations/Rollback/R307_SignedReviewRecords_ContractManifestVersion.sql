/*
  R307: Rollback 307_SignedReviewRecords_ContractManifestVersion.sql —
  drop typed ContractManifestVersion index + column from SignedReviewRecords
  (and GoldenManifests when still a base table).
*/

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
      AND object_id = OBJECT_ID(N'dbo.SignedReviewRecords'))
BEGIN
    DROP INDEX IX_GoldenManifests_Scope_ContractManifestVersion ON dbo.SignedReviewRecords;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
      AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
BEGIN
    DROP INDEX IX_GoldenManifests_Scope_ContractManifestVersion ON dbo.GoldenManifests;
END
GO

IF OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SignedReviewRecords', N'ContractManifestVersion') IS NOT NULL
    ALTER TABLE dbo.SignedReviewRecords DROP COLUMN ContractManifestVersion;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ContractManifestVersion') IS NOT NULL
    ALTER TABLE dbo.GoldenManifests DROP COLUMN ContractManifestVersion;
GO
