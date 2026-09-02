IF COL_LENGTH(N'dbo.Runs', N'PinnedFocusedPilotCloudProvider') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs
        DROP COLUMN PinnedFocusedPilotCloudProvider;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedFocusedPilotModeEnabled') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs
        DROP COLUMN PinnedFocusedPilotModeEnabled;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedEvidencePackagePinsHashSha256') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs
        DROP COLUMN PinnedEvidencePackagePinsHashSha256;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'PinnedEvidencePackagePinsJson') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs
        DROP COLUMN PinnedEvidencePackagePinsJson;
END;
GO
