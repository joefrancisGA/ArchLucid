/*
  Reverse 427 after reverting the dependent application and R428.
  Verify the pre-427 permission baseline before removing the explicit DENY.
  No direct GRANT is issued; the separate 426 evidence protections remain.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.uspRemediationCreateScoped', N'P') IS NOT NULL
   OR OBJECT_ID(N'dbo.uspRemediationAppendEvidenceScoped', N'P') IS NOT NULL
    THROW 51427, N'Reverse migration 428 first.', 1;

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.database_permissions
        WHERE grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND class = 1 AND minor_id = 0 AND major_id = OBJECT_ID(N'dbo.RemediationInstances', N'U')
          AND permission_name = N'UPDATE' AND state = 'D')
    REVOKE UPDATE ON OBJECT::dbo.RemediationInstances FROM [ArchLucidApp];

-- Dropping the modules also removes their object-specific EXECUTE permissions.
DROP PROCEDURE IF EXISTS dbo.uspRemediationUpdateScoped;
DROP PROCEDURE IF EXISTS dbo.uspRemediationCommitApproval;
DROP PROCEDURE IF EXISTS dbo.uspRemediationCommitVerification;
COMMIT TRANSACTION;
GO
