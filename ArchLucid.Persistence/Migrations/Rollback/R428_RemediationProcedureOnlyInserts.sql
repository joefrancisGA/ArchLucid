/*
  Reverse 428 after reverting the dependent application.
  Verify the pre-428 permission baseline before removing explicit DENYs.
  Keep the 426 evidence immutability and 427 atomic update boundary intact.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.database_permissions
        WHERE grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND class = 1 AND minor_id = 0 AND major_id = OBJECT_ID(N'dbo.RemediationInstances', N'U')
          AND permission_name = N'INSERT' AND state = 'D')
        REVOKE INSERT ON OBJECT::dbo.RemediationInstances FROM [ArchLucidApp];

    IF EXISTS (SELECT 1 FROM sys.database_permissions
        WHERE grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND class = 1 AND minor_id = 0 AND major_id = OBJECT_ID(N'dbo.RemediationEvidence', N'U')
          AND permission_name = N'INSERT' AND state = 'D')
        REVOKE INSERT ON OBJECT::dbo.RemediationEvidence FROM [ArchLucidApp];
END;

DROP PROCEDURE IF EXISTS dbo.uspRemediationCreateScoped;
DROP PROCEDURE IF EXISTS dbo.uspRemediationAppendEvidenceScoped;
COMMIT TRANSACTION;
GO
