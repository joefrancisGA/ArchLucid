/*
  R277: Rollback 277_UserInvitations.sql — drop tenant-scoped user invitations.
*/

IF OBJECT_ID(N'dbo.UserInvitations', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.UserInvitations;
END;
GO
