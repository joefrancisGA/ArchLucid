/*
  R343: Rollback 343_RunCreatePinsWave6.sql —
  drop create-time evidence pin and focused-pilot columns from the physical
  run/review table (dbo.Reviews after ADR 0064, else dbo.Runs).
*/

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedFocusedPilotCloudProvider') IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN PinnedFocusedPilotCloudProvider;';

    EXEC sp_executesql @sql;
END

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedFocusedPilotModeEnabled') IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN PinnedFocusedPilotModeEnabled;';

    EXEC sp_executesql @sql;
END

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedEvidencePackagePinsHashSha256') IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN PinnedEvidencePackagePinsHashSha256;';

    EXEC sp_executesql @sql;
END

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedEvidencePackagePinsJson') IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN PinnedEvidencePackagePinsJson;';

    EXEC sp_executesql @sql;
END
GO
