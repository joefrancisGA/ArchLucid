/*
  343: Wave-6 robustness — create-time evidence pins and focused-pilot scope on run headers.

  - Runs.PinnedEvidencePackagePinsJson / PinnedEvidencePackagePinsHashSha256
  - Runs.PinnedFocusedPilotModeEnabled / PinnedFocusedPilotCloudProvider
*/

IF COL_LENGTH(N'dbo.Runs', N'PinnedEvidencePackagePinsJson') IS NULL
BEGIN
    ALTER TABLE dbo.Runs
        ADD PinnedEvidencePackagePinsJson NVARCHAR(MAX) NULL;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedEvidencePackagePinsHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.Runs
        ADD PinnedEvidencePackagePinsHashSha256 VARBINARY(32) NULL;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedFocusedPilotModeEnabled') IS NULL
BEGIN
    ALTER TABLE dbo.Runs
        ADD PinnedFocusedPilotModeEnabled BIT NULL;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedFocusedPilotCloudProvider') IS NULL
BEGIN
    ALTER TABLE dbo.Runs
        ADD PinnedFocusedPilotCloudProvider INT NULL;
END;
GO
