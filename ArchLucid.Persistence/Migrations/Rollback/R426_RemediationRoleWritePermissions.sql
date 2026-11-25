/*
  R426 manual rollback: revoking ArchLucidApp DENY permissions on remediation evidence/instances
  can restore ad-hoc DML. Stop app instances and verify backups before REVOKE DENY in production.
*/
SET NOCOUNT ON;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.RemediationEvidence', N'U') IS NOT NULL
BEGIN
    REVOKE DENY UPDATE ON dbo.RemediationEvidence FROM [ArchLucidApp];
    REVOKE DENY DELETE ON dbo.RemediationEvidence FROM [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
BEGIN
    REVOKE DENY DELETE ON dbo.RemediationInstances FROM [ArchLucidApp];
END;
GO
