/*
  Rollback 097: remove RLS on TenantOnboardingState, then drop the table.
*/
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchiforgeTenantScope')
   AND OBJECT_ID(N'dbo.TenantOnboardingState', N'U') IS NOT NULL
BEGIN
    BEGIN TRY
        ALTER SECURITY POLICY rls.ArchiforgeTenantScope
            DROP FILTER PREDICATE ON dbo.TenantOnboardingState,
            DROP BLOCK PREDICATE ON dbo.TenantOnboardingState FOR AFTER INSERT,
            DROP BLOCK PREDICATE ON dbo.TenantOnboardingState FOR AFTER UPDATE,
            DROP BLOCK PREDICATE ON dbo.TenantOnboardingState FOR BEFORE DELETE;
    END TRY
    BEGIN CATCH
        /* Idempotent rollback when predicates were never bound. */
    END CATCH;
END;
GO

IF OBJECT_ID(N'dbo.TenantOnboardingState', N'U') IS NOT NULL
    DROP TABLE dbo.TenantOnboardingState;
GO
