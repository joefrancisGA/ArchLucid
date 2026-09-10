IF OBJECT_ID(N'dbo.FindingVerificationResults', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.FindingVerificationResults;
END;
GO

IF OBJECT_ID(N'dbo.FindingVerificationReports', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.FindingVerificationReports;
END;
GO
