IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'CreatedByUserId') IS NULL
    ALTER TABLE dbo.Runs ADD CreatedByUserId NVARCHAR(256) NULL;
GO
