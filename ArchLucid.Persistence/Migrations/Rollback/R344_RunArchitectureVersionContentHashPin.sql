IF COL_LENGTH(N'dbo.Runs', N'PinnedArchitectureVersionContentHashSha256') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs
        DROP COLUMN PinnedArchitectureVersionContentHashSha256;
END;
GO
