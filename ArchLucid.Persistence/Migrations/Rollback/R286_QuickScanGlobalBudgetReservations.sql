/*
  R286: Rollback 286_QuickScanGlobalBudgetReservations.sql — drop Quick Scan global budget reservation store.
*/

IF OBJECT_ID(N'dbo.usp_QuickScanGlobalBudget_Release', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanGlobalBudget_Release;
END;
GO

IF OBJECT_ID(N'dbo.usp_QuickScanGlobalBudget_Commit', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanGlobalBudget_Commit;
END;
GO

IF OBJECT_ID(N'dbo.usp_QuickScanGlobalBudget_TryReserve', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanGlobalBudget_TryReserve;
END;
GO

IF OBJECT_ID(N'dbo.QuickScanGlobalBudgetReservations', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanGlobalBudgetReservations;
END;
GO

IF OBJECT_ID(N'dbo.QuickScanGlobalBudgetBuckets', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanGlobalBudgetBuckets;
END;
GO
