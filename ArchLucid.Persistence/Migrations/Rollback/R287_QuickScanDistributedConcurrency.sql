/*
  R287: Rollback 287_QuickScanDistributedConcurrency.sql — drop Quick Scan concurrency procs and tables.
*/

IF OBJECT_ID(N'dbo.usp_QuickScanConcurrency_RenewLease', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanConcurrency_RenewLease;
END;
GO

IF OBJECT_ID(N'dbo.usp_QuickScanConcurrency_AbandonQueue', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanConcurrency_AbandonQueue;
END;
GO

IF OBJECT_ID(N'dbo.usp_QuickScanConcurrency_ReleaseLease', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanConcurrency_ReleaseLease;
END;
GO

IF OBJECT_ID(N'dbo.usp_QuickScanConcurrency_TryPromote', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanConcurrency_TryPromote;
END;
GO

IF OBJECT_ID(N'dbo.usp_QuickScanConcurrency_TryAdmit', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanConcurrency_TryAdmit;
END;
GO

IF OBJECT_ID(N'dbo.QuickScanConcurrencyQueue', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanConcurrencyQueue;
END;
GO

IF OBJECT_ID(N'dbo.QuickScanConcurrencyLeases', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanConcurrencyLeases;
END;
GO
