/*
  343: Wave-6 robustness — create-time evidence pins and focused-pilot scope on run headers.

  - Runs.PinnedEvidencePackagePinsJson / PinnedEvidencePackagePinsHashSha256
  - Runs.PinnedFocusedPilotModeEnabled / PinnedFocusedPilotCloudProvider

  After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH on the
  synonym returns NULL, so ALTER TABLE dbo.Runs raises SQL 4909. DDL targets the physical
  table (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql.
*/

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedEvidencePackagePinsJson') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD PinnedEvidencePackagePinsJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @sql;
END

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedEvidencePackagePinsHashSha256') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD PinnedEvidencePackagePinsHashSha256 VARBINARY(32) NULL;';

    EXEC sp_executesql @sql;
END

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedFocusedPilotModeEnabled') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD PinnedFocusedPilotModeEnabled BIT NULL;';

    EXEC sp_executesql @sql;
END

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedFocusedPilotCloudProvider') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD PinnedFocusedPilotCloudProvider INT NULL;';

    EXEC sp_executesql @sql;
END
GO
