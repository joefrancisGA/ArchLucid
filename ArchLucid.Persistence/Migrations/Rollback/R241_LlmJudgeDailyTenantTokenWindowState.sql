/*
  R241: Rollback 241_LlmJudgeDailyTenantTokenWindowState.sql — drop judge UTC-day token pool.
*/

IF OBJECT_ID(N'dbo.LlmJudgeDailyTenantTokenWindowState', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.LlmJudgeDailyTenantTokenWindowState;
END;
GO
