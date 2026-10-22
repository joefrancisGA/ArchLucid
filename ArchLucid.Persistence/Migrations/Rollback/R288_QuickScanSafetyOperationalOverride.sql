/*
  R288: Rollback 288_QuickScanSafetyOperationalOverride.sql — drop Quick Scan safety operational override store.
*/

IF OBJECT_ID(N'dbo.usp_QuickScanSafetyOperational_Set', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanSafetyOperational_Set;
END;
GO

IF OBJECT_ID(N'dbo.usp_QuickScanSafetyOperational_Get', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanSafetyOperational_Get;
END;
GO

IF OBJECT_ID(N'dbo.QuickScanSafetyOperationalOverride', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanSafetyOperationalOverride;
END;
GO
