-- Align dbo.Runs.Description with ArchitectureRequestFieldLimits.MaxDescriptionLength (10 000).
-- SQL Server caps NVARCHAR(n) at n = 4000; use NVARCHAR(MAX) for the 10k application limit.

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'Description') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'Description') <> -1
BEGIN
    ALTER TABLE dbo.Runs ALTER COLUMN Description NVARCHAR(MAX) NULL;
END;
GO
