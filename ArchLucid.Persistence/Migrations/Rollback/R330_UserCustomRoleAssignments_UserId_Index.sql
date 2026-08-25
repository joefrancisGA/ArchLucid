/* Rollback for migration 330: drop custom role assignment user lookup index. */

IF OBJECT_ID(N'dbo.UserCustomRoleAssignments', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_UserCustomRoleAssignments_UserId'
         AND object_id = OBJECT_ID(N'dbo.UserCustomRoleAssignments'))
BEGIN
    DROP INDEX IX_UserCustomRoleAssignments_UserId ON dbo.UserCustomRoleAssignments;
END;
GO
