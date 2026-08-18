/*
  306 — Repair typed ContractManifestVersion on the sealed review record (golden manifest) table.

  Why this migration exists:
    Migration 295 renamed the spine tables (dbo.GoldenManifests -> dbo.SignedReviewRecords) and left
    dbo.GoldenManifests behind as a backward-compatible SYNONYM. Migration 302 then guarded its
    ALTER TABLE with `IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL`. A synonym reports as
    object type 'SN', never 'U', so on every catalog that had already applied 295 the guard was false:
    302 silently did nothing while DbUp still journaled it as applied. Manifest version lookups then
    fail at runtime with "Invalid column name 'ContractManifestVersion'" (SQL error 207), which the API
    surfaces as HTTP 500 "Database Query Failed" on review submit.

  DbUp never re-runs a journaled script, so 302 cannot repair those catalogs — this forward script does.

  Resolves the physical table (post-295 name first, pre-295 name as fallback) instead of the synonym,
  because COL_LENGTH and OBJECT_ID(..., N'U') both return NULL when handed a synonym name. DDL runs
  through sp_executesql so SQL Server defers column binding until after the ALTER has executed.
*/

/* The backfill (JSON_VALUE) and the filtered index both require QUOTED_IDENTIFIER ON. SqlClient defaults
   it on, but sqlcmd defaults it off, so set it explicitly for manual runbook execution. Must be its own
   batch: QUOTED_IDENTIFIER binds at parse time for the batch that follows. */
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @manifestTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL THEN N'dbo.SignedReviewRecords'
        WHEN OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL THEN N'dbo.GoldenManifests'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @manifestTable IS NOT NULL
BEGIN
    IF COL_LENGTH(@manifestTable, N'ContractManifestVersion') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @manifestTable + N' ADD ContractManifestVersion NVARCHAR(128) NULL;';

        EXEC sp_executesql @sql;
    END

    -- Backfill uses the PascalCase JSON path EntityJsonOptions writes (ManifestMetadata.Version -> "Version").
    IF COL_LENGTH(@manifestTable, N'ContractManifestVersion') IS NOT NULL
    BEGIN
        SET @sql = N'
            UPDATE ' + @manifestTable + N'
            SET ContractManifestVersion = LEFT(JSON_VALUE(MetadataJson, ''$.Version''), 128)
            WHERE ContractManifestVersion IS NULL
              AND MetadataJson IS NOT NULL
              AND JSON_VALUE(MetadataJson, ''$.Version'') IS NOT NULL;';

        EXEC sp_executesql @sql;
    END

    -- Index name keeps the legacy GoldenManifests spelling so the 302 and ArchLucid.sql existence checks agree.
    IF COL_LENGTH(@manifestTable, N'ContractManifestVersion') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM sys.indexes
           WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
             AND object_id = OBJECT_ID(@manifestTable))
    BEGIN
        SET @sql = N'
            CREATE NONCLUSTERED INDEX IX_GoldenManifests_Scope_ContractManifestVersion
                ON ' + @manifestTable + N' (TenantId, WorkspaceId, ProjectId, ContractManifestVersion)
                WHERE ContractManifestVersion IS NOT NULL
                  AND ArchivedUtc IS NULL;';

        EXEC sp_executesql @sql;
    END
END
GO
