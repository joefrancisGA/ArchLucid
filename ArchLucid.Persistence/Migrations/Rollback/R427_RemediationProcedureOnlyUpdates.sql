/*
  R427 manual rollback: drops IE-13 scoped UPDATE/approval/verification procedures and restores
  direct UPDATE on dbo.RemediationInstances for ArchLucidApp. Coordinate with application version rollback.
*/
SET NOCOUNT ON;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.uspRemediationUpdateScoped', N'P') IS NOT NULL
    REVOKE EXECUTE ON OBJECT::dbo.uspRemediationUpdateScoped FROM [ArchLucidApp];

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.uspRemediationCommitApproval', N'P') IS NOT NULL
    REVOKE EXECUTE ON OBJECT::dbo.uspRemediationCommitApproval FROM [ArchLucidApp];

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.uspRemediationCommitVerification', N'P') IS NOT NULL
    REVOKE EXECUTE ON OBJECT::dbo.uspRemediationCommitVerification FROM [ArchLucidApp];
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
    REVOKE DENY UPDATE ON OBJECT::dbo.RemediationInstances FROM [ArchLucidApp];
GO

IF OBJECT_ID(N'dbo.uspRemediationCommitVerification', N'P') IS NOT NULL
    DROP PROCEDURE dbo.uspRemediationCommitVerification;

IF OBJECT_ID(N'dbo.uspRemediationCommitApproval', N'P') IS NOT NULL
    DROP PROCEDURE dbo.uspRemediationCommitApproval;

IF OBJECT_ID(N'dbo.uspRemediationUpdateScoped', N'P') IS NOT NULL
    DROP PROCEDURE dbo.uspRemediationUpdateScoped;
GO
