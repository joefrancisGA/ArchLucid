/*
  Reverse DbUp 159 — dbo.CommitRunIdempotency, dbo.ProjectRoleAssignments.
*/

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
BEGIN
    REVOKE SELECT, INSERT, UPDATE, DELETE ON dbo.ProjectRoleAssignments TO [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
BEGIN
    REVOKE SELECT, INSERT, UPDATE, DELETE ON dbo.CommitRunIdempotency TO [ArchLucidApp];
END;
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchLucidTenantScope')
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
BEGIN
    ALTER SECURITY POLICY rls.ArchLucidTenantScope
        DROP FILTER PREDICATE ON dbo.ProjectRoleAssignments,
        DROP BLOCK PREDICATE ON dbo.ProjectRoleAssignments FOR AFTER INSERT,
        DROP BLOCK PREDICATE ON dbo.ProjectRoleAssignments FOR AFTER UPDATE,
        DROP BLOCK PREDICATE ON dbo.ProjectRoleAssignments FOR BEFORE DELETE;
END;
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchLucidTenantScope')
   AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
BEGIN
    ALTER SECURITY POLICY rls.ArchLucidTenantScope
        DROP FILTER PREDICATE ON dbo.CommitRunIdempotency,
        DROP BLOCK PREDICATE ON dbo.CommitRunIdempotency FOR AFTER INSERT,
        DROP BLOCK PREDICATE ON dbo.CommitRunIdempotency FOR AFTER UPDATE,
        DROP BLOCK PREDICATE ON dbo.CommitRunIdempotency BEFORE DELETE;
END;
GO

IF OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
    DROP TABLE dbo.ProjectRoleAssignments;
GO

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
    DROP TABLE dbo.CommitRunIdempotency;
GO
