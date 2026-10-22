/* 329 — SCIM group member listing by tenant + group (DapperScimGroupRepository). */

IF OBJECT_ID(N'dbo.ScimGroupMembers', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ScimGroupMembers_Tenant_Group'
         AND object_id = OBJECT_ID(N'dbo.ScimGroupMembers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ScimGroupMembers_Tenant_Group
        ON dbo.ScimGroupMembers (TenantId, GroupId)
        INCLUDE (UserId);
END;
GO
