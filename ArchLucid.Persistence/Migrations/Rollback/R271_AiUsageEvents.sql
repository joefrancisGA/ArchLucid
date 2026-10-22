/*
  R271: Rollback 271_AiUsageEvents.sql — drop AI usage event storage.
*/

IF OBJECT_ID(N'dbo.AiUsageEvents', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AiUsageEvents;
END;
GO
