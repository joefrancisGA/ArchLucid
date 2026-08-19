/*
  R292: Rollback 292_QuickScanIdentityAbuseLimits.sql — drop Quick Scan identity abuse proc and tables.
*/

IF OBJECT_ID(N'dbo.usp_QuickScanIdentityAbuse_TryAdmit', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanIdentityAbuse_TryAdmit;
END;
GO

IF OBJECT_ID(N'dbo.QuickScanIdentityAbusePayloads', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanIdentityAbusePayloads;
END;
GO

IF OBJECT_ID(N'dbo.QuickScanIdentityAbuseCounters', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanIdentityAbuseCounters;
END;
GO
