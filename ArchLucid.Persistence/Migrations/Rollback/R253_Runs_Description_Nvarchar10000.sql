/*
  R253: Rollback 253_Runs_Description_Nvarchar10000.sql — revert dbo.Runs.Description to baseline width.
*/

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'Description') = 10000
BEGIN
    ALTER TABLE dbo.Runs ALTER COLUMN Description NVARCHAR(4000) NULL;
END;
GO
