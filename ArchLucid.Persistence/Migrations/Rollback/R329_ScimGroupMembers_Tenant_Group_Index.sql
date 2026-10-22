/* Rollback for migration 329: drop SCIM group member listing index. */

IF OBJECT_ID(N'dbo.ScimGroupMembers', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ScimGroupMembers_Tenant_Group'
         AND object_id = OBJECT_ID(N'dbo.ScimGroupMembers'))
BEGIN
    DROP INDEX IX_ScimGroupMembers_Tenant_Group ON dbo.ScimGroupMembers;
END;
GO
