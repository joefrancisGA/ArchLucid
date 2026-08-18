/*
  R306: Rollback 306_SignedReviewRecords_ContractManifestVersion_Repair.sql —
  drop the typed ContractManifestVersion index + column from the physical sealed review record table.

  Resolves the physical table (post-295 dbo.SignedReviewRecords, pre-295 dbo.GoldenManifests) rather than
  the backward-compatible synonym: OBJECT_ID(..., N'U') and COL_LENGTH both return NULL for a synonym.
*/

/* Dropping a filtered index requires QUOTED_IDENTIFIER ON; sqlcmd defaults it off. Own batch — the
   setting binds at parse time for the following batch. */
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
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
          AND object_id = OBJECT_ID(@manifestTable))
    BEGIN
        SET @sql = N'DROP INDEX IX_GoldenManifests_Scope_ContractManifestVersion ON ' + @manifestTable + N';';

        EXEC sp_executesql @sql;
    END

    IF COL_LENGTH(@manifestTable, N'ContractManifestVersion') IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE ' + @manifestTable + N' DROP COLUMN ContractManifestVersion;';

        EXEC sp_executesql @sql;
    END
END
GO
