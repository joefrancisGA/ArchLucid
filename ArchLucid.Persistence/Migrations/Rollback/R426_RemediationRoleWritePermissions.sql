/*
  Reverse 426 only after application rollback and review of the pre-426
  permission baseline. Removing a DENY can expose inherited permissions.
  Do not run if any of these DENYs predated 426. No direct GRANT is issued.
  Execute after R428 and R427 when rolling back the complete boundary.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.uspRemediationUpdateScoped', N'P') IS NOT NULL
   OR OBJECT_ID(N'dbo.uspRemediationCreateScoped', N'P') IS NOT NULL
    THROW 51426, N'Reverse the dependent procedure-only migrations first.', 1;

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.database_permissions
        WHERE grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND class = 1 AND minor_id = 0 AND major_id = OBJECT_ID(N'dbo.RemediationEvidence', N'U')
          AND permission_name = N'UPDATE' AND state = 'D')
        REVOKE UPDATE ON OBJECT::dbo.RemediationEvidence FROM [ArchLucidApp];

    IF EXISTS (SELECT 1 FROM sys.database_permissions
        WHERE grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND class = 1 AND minor_id = 0 AND major_id = OBJECT_ID(N'dbo.RemediationEvidence', N'U')
          AND permission_name = N'DELETE' AND state = 'D')
        REVOKE DELETE ON OBJECT::dbo.RemediationEvidence FROM [ArchLucidApp];

    IF EXISTS (SELECT 1 FROM sys.database_permissions
        WHERE grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND class = 1 AND minor_id = 0 AND major_id = OBJECT_ID(N'dbo.RemediationInstances', N'U')
          AND permission_name = N'DELETE' AND state = 'D')
        REVOKE DELETE ON OBJECT::dbo.RemediationInstances FROM [ArchLucidApp];
END;
COMMIT TRANSACTION;
GO
