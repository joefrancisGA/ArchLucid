/*
  R428 manual rollback: drops scoped remediation INSERT/append procedures granted in migration 428.
*/
SET NOCOUNT ON;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.uspRemediationCreateScoped', N'P') IS NOT NULL
    REVOKE EXECUTE ON OBJECT::dbo.uspRemediationCreateScoped FROM [ArchLucidApp];

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.uspRemediationAppendEvidenceScoped', N'P') IS NOT NULL
    REVOKE EXECUTE ON OBJECT::dbo.uspRemediationAppendEvidenceScoped FROM [ArchLucidApp];
GO

IF OBJECT_ID(N'dbo.uspRemediationAppendEvidenceScoped', N'P') IS NOT NULL
    DROP PROCEDURE dbo.uspRemediationAppendEvidenceScoped;

IF OBJECT_ID(N'dbo.uspRemediationCreateScoped', N'P') IS NOT NULL
    DROP PROCEDURE dbo.uspRemediationCreateScoped;
GO
