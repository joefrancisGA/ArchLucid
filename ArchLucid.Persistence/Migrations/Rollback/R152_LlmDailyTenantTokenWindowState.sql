/*
  Roll back DbUp 152 — dbo.LlmDailyTenantTokenWindowState (per-tenant UTC-day LLM token totals).
*/

IF OBJECT_ID(N'dbo.LlmDailyTenantTokenWindowState', N'U') IS NOT NULL
    DROP TABLE dbo.LlmDailyTenantTokenWindowState;
GO
