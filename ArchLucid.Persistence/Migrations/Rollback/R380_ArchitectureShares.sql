/*
  R380: Rollback 380_ArchitectureShares.sql — drop dbo.ArchitectureShares and RestrictToShares column.
*/

IF OBJECT_ID(N'dbo.ArchitectureShares', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ArchitectureShares;
END;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'RestrictToShares') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Architectures DROP CONSTRAINT DF_Architectures_RestrictToShares;
    ALTER TABLE dbo.Architectures DROP COLUMN RestrictToShares;
END;
GO
