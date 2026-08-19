/*
  R255: Rollback 255_FindingRecords_InsightDensity.sql — drop TB-382 insight-density columns on finding rows.
*/

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'DecisionConsequence') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN DecisionConsequence;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'PrincipalArchitectValue') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN PrincipalArchitectValue;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'WhyThisIsNotGeneric') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN WhyThisIsNotGeneric;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'Classification') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN Classification;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'Treatment') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN Treatment;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'InsightDensityScore') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN InsightDensityScore;
GO
