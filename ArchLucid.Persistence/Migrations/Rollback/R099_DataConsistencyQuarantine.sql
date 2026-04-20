/*
  Rollback 099: remove operational quarantine table for graded data-consistency enforcement.
*/
IF OBJECT_ID(N'dbo.DataConsistencyQuarantine', N'U') IS NOT NULL
    DROP TABLE dbo.DataConsistencyQuarantine;
GO
