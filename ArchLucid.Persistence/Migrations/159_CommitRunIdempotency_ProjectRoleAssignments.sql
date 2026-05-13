/*
  DbUp 159:
  - dbo.CommitRunIdempotency — Idempotency-Key semantics for POST /v1/architecture/run/{runId}/commit (scope-triple + run + key hash).
  - dbo.ProjectRoleAssignments — project-scoped RBAC overlays (dbo.ScimUsers.Id as UserId) at tenant/workspace/project scope.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CommitRunIdempotency
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        RunId                   NVARCHAR(64)       NOT NULL,
        IdempotencyKeyHash      VARBINARY(32)      NOT NULL,
        RequestFingerprint      VARBINARY(32)      NOT NULL,
        CreatedUtc               DATETIME2(7)      NOT NULL
            CONSTRAINT DF_CommitRunIdempotency_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_CommitRunIdempotency PRIMARY KEY CLUSTERED (TenantId, WorkspaceId, ProjectId, RunId, IdempotencyKeyHash),
        CONSTRAINT FK_CommitRunIdempotency_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT CK_CommitRunIdempotency_RunIdLen CHECK (LEN(RunId) > 0)
    );

    CREATE NONCLUSTERED INDEX IX_CommitRunIdempotency_Scope_Key
        ON dbo.CommitRunIdempotency (TenantId, WorkspaceId, ProjectId, IdempotencyKeyHash);
END;
GO

IF OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectRoleAssignments
    (
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ProjectId       UNIQUEIDENTIFIER NOT NULL,
        UserId          UNIQUEIDENTIFIER NOT NULL,
        Role            NVARCHAR(32)     NOT NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL CONSTRAINT DF_ProjectRoleAssignments_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ProjectRoleAssignments PRIMARY KEY CLUSTERED (TenantId, ProjectId, UserId),
        CONSTRAINT FK_ProjectRoleAssignments_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT FK_ProjectRoleAssignments_ScimUsers FOREIGN KEY (UserId) REFERENCES dbo.ScimUsers (Id),
        CONSTRAINT CK_ProjectRoleAssignments_Role CHECK (Role IN (N'Reader', N'Operator', N'ProjectAdmin'))
    );

    CREATE NONCLUSTERED INDEX IX_ProjectRoleAssignments_User_Scope
        ON dbo.ProjectRoleAssignments (TenantId, WorkspaceId, ProjectId, UserId)
        INCLUDE (Role);
END;
GO

IF EXISTS (
        SELECT 1
        FROM sys.security_policies
        WHERE name = N'ArchLucidTenantScope'
          AND schema_id = SCHEMA_ID(N'rls'))
   AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS p
        INNER JOIN sys.objects AS t ON t.object_id = p.target_object_id
        WHERE SCHEMA_NAME(t.schema_id) = N'dbo'
          AND t.name = N'CommitRunIdempotency')
BEGIN
    EXEC (N'ALTER SECURITY POLICY rls.ArchLucidTenantScope
        ADD FILTER PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CommitRunIdempotency,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CommitRunIdempotency AFTER INSERT,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CommitRunIdempotency AFTER UPDATE,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.CommitRunIdempotency BEFORE DELETE;');
END;
GO

IF EXISTS (
        SELECT 1
        FROM sys.security_policies
        WHERE name = N'ArchLucidTenantScope'
          AND schema_id = SCHEMA_ID(N'rls'))
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS p
        INNER JOIN sys.objects AS t ON t.object_id = p.target_object_id
        WHERE SCHEMA_NAME(t.schema_id) = N'dbo'
          AND t.name = N'ProjectRoleAssignments')
BEGIN
    EXEC (N'ALTER SECURITY POLICY rls.ArchLucidTenantScope
        ADD FILTER PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.ProjectRoleAssignments,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.ProjectRoleAssignments AFTER INSERT,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.ProjectRoleAssignments AFTER UPDATE,
        ADD BLOCK PREDICATE rls.archlucid_scope_predicate(TenantId, WorkspaceId, ProjectId) ON dbo.ProjectRoleAssignments BEFORE DELETE;');
END;
GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ArchLucidApp')
   AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        WHERE dp.major_id = OBJECT_ID(N'dbo.CommitRunIdempotency')
          AND dp.grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND dp.permission_name = N'SELECT')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.CommitRunIdempotency TO [ArchLucidApp];
END;
GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ArchLucidApp')
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        WHERE dp.major_id = OBJECT_ID(N'dbo.ProjectRoleAssignments')
          AND dp.grantee_principal_id = DATABASE_PRINCIPAL_ID(N'ArchLucidApp')
          AND dp.permission_name = N'SELECT')
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ProjectRoleAssignments TO [ArchLucidApp];
END;
GO
