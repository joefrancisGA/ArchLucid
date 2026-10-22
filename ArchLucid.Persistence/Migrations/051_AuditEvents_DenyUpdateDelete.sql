-- Migration 051: Enforce append-only semantics on dbo.AuditEvents at the database level.
-- IAuditRepository is insert-only; this blocks UPDATE/DELETE for the least-privilege application principal.
--
-- Role name: We use the database role [ArchLucidApp] as the canonical application DML role.
--   - This repo's Terraform modules do not emit CREATE ROLE today; operators create [ArchLucidApp],
--     grant required table permissions, and ALTER ROLE [ArchLucidApp] ADD MEMBER [your-managed-identity-user]
--     (see docs/security/MANAGED_IDENTITY_SQL_BLOB.md).
--   - The placeholder [archlucid-app] is avoided here: unquoted identifiers cannot contain hyphens;
--     bracketed [archlucid-app] is valid but we standardize on ArchLucidApp for clarity.
--
-- Skip when the role is missing: local/dev often connects as dbo/sa (db_owner), which is not the target.
-- dbo/db_owner can still UPDATE/DELETE for break-glass correction.
--
-- Deployments that only use db_datawriter without ArchLucidApp should create this role and move the app
-- principal into it (recommended), or apply an environment-specific DENY ... TO [db_datawriter] for this table.

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
        WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
          AND dp.major_id = OBJECT_ID(N'dbo.AuditEvents')
          AND dp.permission_name = N'UPDATE'
          AND dp.state_desc = N'DENY'
          AND gp.name = N'ArchLucidApp')
BEGIN
    DENY UPDATE ON dbo.AuditEvents TO [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.database_permissions AS dp
        INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
        WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
          AND dp.major_id = OBJECT_ID(N'dbo.AuditEvents')
          AND dp.permission_name = N'DELETE'
          AND dp.state_desc = N'DENY'
          AND gp.name = N'ArchLucidApp')
BEGIN
    DENY DELETE ON dbo.AuditEvents TO [ArchLucidApp];
END;
GO
