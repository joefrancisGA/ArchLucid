/*
  R280: Rollback 280_EmailOtpAuthentication.sql — drop email OTP challenges and sign-in domain policy.
*/

IF OBJECT_ID(N'dbo.EmailOtpChallenges', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.EmailOtpChallenges;
END;
GO

IF OBJECT_ID(N'dbo.TenantSignInEmailDomains', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantSignInEmailDomains;
END;
GO
