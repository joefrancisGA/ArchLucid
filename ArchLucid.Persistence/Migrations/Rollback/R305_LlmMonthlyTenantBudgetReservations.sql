-- Rollback TB-976 monthly per-call reservation leases.

IF OBJECT_ID(N'dbo.usp_LlmMonthlyTenantBudget_ReconcileUnsettled', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_LlmMonthlyTenantBudget_ReconcileUnsettled;
GO

IF OBJECT_ID(N'dbo.usp_LlmMonthlyTenantBudget_Release', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_LlmMonthlyTenantBudget_Release;
GO

IF OBJECT_ID(N'dbo.usp_LlmMonthlyTenantBudget_Settle', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_LlmMonthlyTenantBudget_Settle;
GO

IF OBJECT_ID(N'dbo.usp_LlmMonthlyTenantBudget_TryReserve', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_LlmMonthlyTenantBudget_TryReserve;
GO

IF OBJECT_ID(N'dbo.usp_LlmMonthlyTenantBudget_ExpirePendingReservations', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_LlmMonthlyTenantBudget_ExpirePendingReservations;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_LlmMonthlyTenantBudgetReservations_Expires_Pending'
      AND object_id = OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetReservations'))
    DROP INDEX IX_LlmMonthlyTenantBudgetReservations_Expires_Pending ON dbo.LlmMonthlyTenantBudgetReservations;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_LlmMonthlyTenantBudgetReservations_Tenant_Period_Pending'
      AND object_id = OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetReservations'))
    DROP INDEX IX_LlmMonthlyTenantBudgetReservations_Tenant_Period_Pending ON dbo.LlmMonthlyTenantBudgetReservations;
GO

IF OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetReservations', N'U') IS NOT NULL
    DROP TABLE dbo.LlmMonthlyTenantBudgetReservations;
GO
