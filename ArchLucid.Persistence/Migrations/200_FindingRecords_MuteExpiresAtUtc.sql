IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'MuteExpiresAtUtc') IS NULL
BEGIN
    ALTER TABLE dbo.FindingRecords ADD MuteExpiresAtUtc DATETIME2(3) NULL;
END
