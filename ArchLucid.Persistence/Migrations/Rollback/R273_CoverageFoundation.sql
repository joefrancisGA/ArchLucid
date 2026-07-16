/*
  R273: Rollback 273_CoverageFoundation.sql — drop CoverageAssignments and PolicyPacks.QualityDimension.
*/

IF OBJECT_ID(N'dbo.CoverageAssignments', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.CoverageAssignments;
END;
GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'QualityDimension') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_QualityDimension')
    BEGIN
        ALTER TABLE dbo.PolicyPacks DROP CONSTRAINT CK_PolicyPacks_QualityDimension;
    END;

    ALTER TABLE dbo.PolicyPacks DROP COLUMN QualityDimension;
END;
GO
