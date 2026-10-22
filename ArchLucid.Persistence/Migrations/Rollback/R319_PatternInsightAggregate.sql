/*
  R319: Rollback 319_PatternInsightAggregate.sql — drop cross-tenant pattern insight aggregate table.
*/

IF OBJECT_ID(N'dbo.PatternInsightAggregate', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PatternInsightAggregate;
END;
GO
