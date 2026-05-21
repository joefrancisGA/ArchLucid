/*
  R185: Rollback 185_CustomRoles.sql — remove custom roles and user assignment tables.
*/

IF OBJECT_ID(N'dbo.UserCustomRoleAssignments', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.UserCustomRoleAssignments;
END;
GO

IF OBJECT_ID(N'dbo.CustomRoles', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.CustomRoles;
END;
GO
