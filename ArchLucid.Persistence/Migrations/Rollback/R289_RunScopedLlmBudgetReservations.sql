-- Rollback TB-939 run-scoped LLM budget reservations.

IF OBJECT_ID(N'dbo.usp_RunScopedLlmBudget_Release', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RunScopedLlmBudget_Release;
GO

IF OBJECT_ID(N'dbo.usp_RunScopedLlmBudget_Commit', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RunScopedLlmBudget_Commit;
GO

IF OBJECT_ID(N'dbo.usp_RunScopedLlmBudget_TryReserve', N'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RunScopedLlmBudget_TryReserve;
GO

IF OBJECT_ID(N'dbo.RunScopedLlmBudgetReservations', N'U') IS NOT NULL
    DROP TABLE dbo.RunScopedLlmBudgetReservations;
GO
