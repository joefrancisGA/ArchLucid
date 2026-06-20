-- TB-382 Phase B: persist insight-density gate fields on relational finding rows.
IF COL_LENGTH(N'dbo.FindingRecords', N'InsightDensityScore') IS NULL
    ALTER TABLE dbo.FindingRecords ADD InsightDensityScore INT NULL;

IF COL_LENGTH(N'dbo.FindingRecords', N'Treatment') IS NULL
    ALTER TABLE dbo.FindingRecords ADD Treatment TINYINT NULL;

IF COL_LENGTH(N'dbo.FindingRecords', N'Classification') IS NULL
    ALTER TABLE dbo.FindingRecords ADD Classification TINYINT NULL;

IF COL_LENGTH(N'dbo.FindingRecords', N'WhyThisIsNotGeneric') IS NULL
    ALTER TABLE dbo.FindingRecords ADD WhyThisIsNotGeneric NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.FindingRecords', N'PrincipalArchitectValue') IS NULL
    ALTER TABLE dbo.FindingRecords ADD PrincipalArchitectValue NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.FindingRecords', N'DecisionConsequence') IS NULL
    ALTER TABLE dbo.FindingRecords ADD DecisionConsequence NVARCHAR(MAX) NULL;
