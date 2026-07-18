/*
  R276: Rollback 276_PolicyPackDistributionScope.sql — drop PolicyPacks.DistributionScope.
*/

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'DistributionScope') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_DistributionScope')
    BEGIN
        ALTER TABLE dbo.PolicyPacks DROP CONSTRAINT CK_PolicyPacks_DistributionScope;
    END;

    IF OBJECT_ID(N'DF_PolicyPacks_DistributionScope_Create', N'D') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.PolicyPacks DROP CONSTRAINT DF_PolicyPacks_DistributionScope_Create;
    END;

    ALTER TABLE dbo.PolicyPacks DROP COLUMN DistributionScope;
END;
GO
