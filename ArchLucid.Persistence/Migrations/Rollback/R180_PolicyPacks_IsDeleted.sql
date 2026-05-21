/*
  Roll back DbUp 180 — remove PolicyPacks.IsDeleted.
*/

IF COL_LENGTH(N'dbo.PolicyPacks', N'IsDeleted') IS NOT NULL
BEGIN
    ALTER TABLE dbo.PolicyPacks DROP CONSTRAINT IF EXISTS DF_PolicyPacks_IsDeleted;
    ALTER TABLE dbo.PolicyPacks DROP COLUMN IsDeleted;
END;
GO
