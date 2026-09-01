IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'CreatedByUserId') IS NOT NULL
    ALTER TABLE dbo.Runs DROP COLUMN CreatedByUserId;
GO
