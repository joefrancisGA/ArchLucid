/*
  Rollback 096: remove tenant-only RLS bindings and drop predicate function.
*/
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchiforgeTenantScope')
BEGIN
    IF OBJECT_ID(N'dbo.TenantTrialSeatOccupants', N'U') IS NOT NULL
    BEGIN
        ALTER SECURITY POLICY rls.ArchiforgeTenantScope
            DROP FILTER PREDICATE ON dbo.TenantTrialSeatOccupants,
            DROP BLOCK PREDICATE ON dbo.TenantTrialSeatOccupants FOR AFTER INSERT,
            DROP BLOCK PREDICATE ON dbo.TenantTrialSeatOccupants FOR AFTER UPDATE,
            DROP BLOCK PREDICATE ON dbo.TenantTrialSeatOccupants FOR BEFORE DELETE;
    END;

    IF OBJECT_ID(N'dbo.TenantLifecycleTransitions', N'U') IS NOT NULL
    BEGIN
        ALTER SECURITY POLICY rls.ArchiforgeTenantScope
            DROP FILTER PREDICATE ON dbo.TenantLifecycleTransitions,
            DROP BLOCK PREDICATE ON dbo.TenantLifecycleTransitions FOR AFTER INSERT,
            DROP BLOCK PREDICATE ON dbo.TenantLifecycleTransitions FOR AFTER UPDATE,
            DROP BLOCK PREDICATE ON dbo.TenantLifecycleTransitions FOR BEFORE DELETE;
    END;

    IF OBJECT_ID(N'dbo.SentEmails', N'U') IS NOT NULL
    BEGIN
        ALTER SECURITY POLICY rls.ArchiforgeTenantScope
            DROP FILTER PREDICATE ON dbo.SentEmails,
            DROP BLOCK PREDICATE ON dbo.SentEmails FOR AFTER INSERT,
            DROP BLOCK PREDICATE ON dbo.SentEmails FOR AFTER UPDATE,
            DROP BLOCK PREDICATE ON dbo.SentEmails FOR BEFORE DELETE;
    END;
END;
GO

IF OBJECT_ID(N'rls.archiforge_tenant_predicate', N'IF') IS NOT NULL
    DROP FUNCTION rls.archiforge_tenant_predicate;
GO
