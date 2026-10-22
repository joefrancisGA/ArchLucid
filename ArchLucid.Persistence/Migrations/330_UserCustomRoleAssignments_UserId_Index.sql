/* 330 — Custom role assignment lookup by user (SqlCustomRoleRepository). */

IF OBJECT_ID(N'dbo.UserCustomRoleAssignments', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_UserCustomRoleAssignments_UserId'
         AND object_id = OBJECT_ID(N'dbo.UserCustomRoleAssignments'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserCustomRoleAssignments_UserId
        ON dbo.UserCustomRoleAssignments (UserId)
        INCLUDE (CustomRoleId);
END;
GO
