/*
  R370: Rollback 370_FindingCurrentDispositions.sql — drop dbo.FindingCurrentDispositions.
*/

IF OBJECT_ID(N'dbo.FindingCurrentDispositions', N'U') IS NOT NULL
    DROP TABLE dbo.FindingCurrentDispositions;
