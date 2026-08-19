/*
  276: Policy pack DistributionScope — Organization Private vs Platform (TB-781).

  RLS: not applied — scope enforced in application services and tenant-scoped repositories.
*/
IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'DistributionScope') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPacks
        ADD DistributionScope NVARCHAR(50) NOT NULL
            CONSTRAINT DF_PolicyPacks_DistributionScope_Create DEFAULT (N'OrganizationPrivate');
END;
GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'DistributionScope') IS NOT NULL
BEGIN
    UPDATE dbo.PolicyPacks
    SET DistributionScope = N'Platform'
    WHERE PackType IN (N'BuiltIn', N'PlatformDefault');

    UPDATE dbo.PolicyPacks
    SET DistributionScope = N'OrganizationPrivate'
    WHERE PackType IN (N'TenantCustom', N'WorkspaceCustom', N'ProjectCustom')
       OR DistributionScope IS NULL
       OR LTRIM(RTRIM(DistributionScope)) = N'';
END;
GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'DistributionScope') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_DistributionScope')
BEGIN
    ALTER TABLE dbo.PolicyPacks
        ADD CONSTRAINT CK_PolicyPacks_DistributionScope CHECK (
            DistributionScope IN (
                N'Platform',
                N'OrganizationPrivate',
                N'OrganizationShared',
                N'Marketplace'));
END;
GO
