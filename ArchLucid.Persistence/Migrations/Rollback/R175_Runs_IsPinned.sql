/*
  Roll back DbUp 175 — remove Runs.IsPinned.
*/

IF COL_LENGTH(N'dbo.Runs', N'IsPinned') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs DROP CONSTRAINT IF EXISTS DF_Runs_IsPinned;
    ALTER TABLE dbo.Runs DROP COLUMN IsPinned;
END;
GO
