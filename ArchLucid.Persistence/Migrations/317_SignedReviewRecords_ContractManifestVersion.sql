/* 307 — ContractManifestVersion on physical SignedReviewRecords (ADR 0064).

   Migration 302 gated on OBJECT_ID(N'dbo.GoldenManifests', N'U'), which is false after
   295 renamed the table and left GoldenManifests as a synonym. DbUp journaled 302 as a
   no-op, so catalogs still lack the typed column. Prefer SignedReviewRecords for
   COL_LENGTH / ALTER (synonym COL_LENGTH is unreliable — see 300).

   Also covers pre-295 catalogs that still have GoldenManifests as a base table.
   Backfill + index use sp_executesql so SQL Server defers column validation until after ALTER. */

IF OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.SignedReviewRecords', N'ContractManifestVersion') IS NULL
        ALTER TABLE dbo.SignedReviewRecords ADD ContractManifestVersion NVARCHAR(128) NULL;
END
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifests', N'ContractManifestVersion') IS NULL
        ALTER TABLE dbo.GoldenManifests ADD ContractManifestVersion NVARCHAR(128) NULL;
END
GO

IF OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SignedReviewRecords', N'ContractManifestVersion') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        UPDATE dbo.SignedReviewRecords
        SET ContractManifestVersion = LEFT(JSON_VALUE(MetadataJson, ''$.Version''), 128)
        WHERE ContractManifestVersion IS NULL
          AND MetadataJson IS NOT NULL
          AND JSON_VALUE(MetadataJson, ''$.Version'') IS NOT NULL;';
END
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ContractManifestVersion') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        UPDATE dbo.GoldenManifests
        SET ContractManifestVersion = LEFT(JSON_VALUE(MetadataJson, ''$.Version''), 128)
        WHERE ContractManifestVersion IS NULL
          AND MetadataJson IS NOT NULL
          AND JSON_VALUE(MetadataJson, ''$.Version'') IS NOT NULL;';
END
GO

IF OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SignedReviewRecords', N'ContractManifestVersion') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
         AND object_id = OBJECT_ID(N'dbo.SignedReviewRecords'))
BEGIN
    EXEC sp_executesql N'
        CREATE NONCLUSTERED INDEX IX_GoldenManifests_Scope_ContractManifestVersion
            ON dbo.SignedReviewRecords (TenantId, WorkspaceId, ProjectId, ContractManifestVersion)
            WHERE ContractManifestVersion IS NOT NULL
              AND ArchivedUtc IS NULL;';
END
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ContractManifestVersion') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
         AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
BEGIN
    EXEC sp_executesql N'
        CREATE NONCLUSTERED INDEX IX_GoldenManifests_Scope_ContractManifestVersion
            ON dbo.GoldenManifests (TenantId, WorkspaceId, ProjectId, ContractManifestVersion)
            WHERE ContractManifestVersion IS NOT NULL
              AND ArchivedUtc IS NULL;';
END
GO
