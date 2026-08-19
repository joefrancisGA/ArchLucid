/*
  R274: Rollback 274_Runs_PackageOrigin.sql — drop dbo.Runs.PackageOrigin (TB-740 intake metadata).
*/

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'PackageOrigin') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs DROP COLUMN PackageOrigin;
END;
GO
