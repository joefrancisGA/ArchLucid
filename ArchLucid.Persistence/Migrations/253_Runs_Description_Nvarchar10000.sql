-- Align dbo.Runs.Description with ArchitectureRequestFieldLimits.MaxDescriptionLength (10 000).

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'Description') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'Description') < 10000
BEGIN
    ALTER TABLE dbo.Runs ALTER COLUMN Description NVARCHAR(10000) NULL;
END;
GO
