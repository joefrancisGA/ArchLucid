/* 302 — Typed ContractManifestVersion on GoldenManifests for GetByContractManifestVersionAsync.

   Dual-write target so lookups stop using JSON_VALUE(MetadataJson, '$.Version').
   Backfill uses the same PascalCase JSON path as the historical filter (EntityJsonOptions
   writes ManifestMetadata.Version as "Version", not camelCase).

   Backfill + index DDL use sp_executesql so SQL Server defers column validation until
   after the ALTER TABLE batch has run (static UPDATE/CREATE INDEX fail compile-time otherwise). */

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifests', N'ContractManifestVersion') IS NULL
        ALTER TABLE dbo.GoldenManifests ADD ContractManifestVersion NVARCHAR(128) NULL;
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
