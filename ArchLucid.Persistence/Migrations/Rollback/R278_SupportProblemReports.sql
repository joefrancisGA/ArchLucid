/*
  R278: Rollback 278_SupportProblemReports.sql — drop tenant-scoped support problem reports.
*/

IF OBJECT_ID(N'dbo.SupportProblemReports', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SupportProblemReports;
END;
GO
