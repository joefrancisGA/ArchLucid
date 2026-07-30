/*
  R291: Rollback 291_SelfServiceTrialAbuse.sql — drop self-service trial abuse tracking tables.
*/

IF OBJECT_ID(N'dbo.PlatformSelfServiceTrialDomainClaims', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PlatformSelfServiceTrialDomainClaims;
END;
GO

IF OBJECT_ID(N'dbo.PlatformSelfServiceTrialEmailClaims', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PlatformSelfServiceTrialEmailClaims;
END;
GO
