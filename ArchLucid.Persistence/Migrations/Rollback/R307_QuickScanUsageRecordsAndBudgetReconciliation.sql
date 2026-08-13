/*
  R307: Rollback 307_QuickScanUsageRecordsAndBudgetReconciliation.sql
*/

IF OBJECT_ID(N'dbo.usp_QuickScanBudget_ReconcileExpired', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanBudget_ReconcileExpired;
END
GO

IF OBJECT_ID(N'dbo.usp_QuickScanBudget_GetSnapshot', N'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.usp_QuickScanBudget_GetSnapshot;
END
GO

IF OBJECT_ID(N'dbo.QuickScanUsageRecords', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.QuickScanUsageRecords;
END
GO
