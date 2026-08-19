/*
  R269: Rollback 269_TechnologyLedgerEntries.sql — drop Technology Ledger storage.
*/

IF OBJECT_ID(N'dbo.TechnologyLedgerEntries', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TechnologyLedgerEntries;
END;
GO
