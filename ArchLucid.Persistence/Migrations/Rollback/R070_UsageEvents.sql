/*
  Rollback 070: remove UsageEvents RLS bindings then drop table.
*/

IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NOT NULL
    DROP TABLE dbo.UsageEvents;
GO
