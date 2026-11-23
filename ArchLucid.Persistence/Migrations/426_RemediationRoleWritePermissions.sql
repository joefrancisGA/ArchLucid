/*
  426: Least-privilege remediation runtime role — protect append-only
  remediation evidence and forbid broad instance deletion.

  The application MUST still UPDATE dbo.RemediationInstances for scoped
  rowversion-CAS state transitions (IE-13); DENY UPDATE on that table
  would break existing production code. A trusted stored-procedure-only
  role would be needed to eliminate ad-hoc UPDATE privileges completely.

  Follow migration 051/247's [ArchLucidApp] deployment convention. This
  script does not create users, grant role membership or revoke SELECT/
  INSERT/instance-UPDATE rights. Operators must ensure the connected app
  principal belongs to this role and is not dbo/db_owner.
*/

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.RemediationEvidence', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.database_permissions AS p
       JOIN sys.database_principals AS g ON p.grantee_principal_id = g.principal_id
       WHERE p.class_desc = N'OBJECT_OR_COLUMN'
         AND p.major_id = OBJECT_ID(N'dbo.RemediationEvidence')
         AND p.permission_name = N'UPDATE'
         AND p.state_desc = N'DENY'
         AND g.name = N'ArchLucidApp')
BEGIN
    DENY UPDATE ON dbo.RemediationEvidence TO [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.RemediationEvidence', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.database_permissions AS p
       JOIN sys.database_principals AS g ON p.grantee_principal_id = g.principal_id
       WHERE p.class_desc = N'OBJECT_OR_COLUMN'
         AND p.major_id = OBJECT_ID(N'dbo.RemediationEvidence')
         AND p.permission_name = N'DELETE'
         AND p.state_desc = N'DENY'
         AND g.name = N'ArchLucidApp')
BEGIN
    DENY DELETE ON dbo.RemediationEvidence TO [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.database_permissions AS p
       JOIN sys.database_principals AS g ON p.grantee_principal_id = g.principal_id
       WHERE p.class_desc = N'OBJECT_OR_COLUMN'
         AND p.major_id = OBJECT_ID(N'dbo.RemediationInstances')
         AND p.permission_name = N'DELETE'
         AND p.state_desc = N'DENY'
         AND g.name = N'ArchLucidApp')
BEGIN
    DENY DELETE ON dbo.RemediationInstances TO [ArchLucidApp];
END;
GO
