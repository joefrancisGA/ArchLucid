/*
  R279: Rollback 279_PlatformIdentityModel.sql — drop platform identity tables and legacy links.
*/

IF OBJECT_ID(N'dbo.IdentityMigrationReviewItems', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.IdentityMigrationReviewItems;
END;
GO

IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ScimUsers', N'PlatformUserId') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'FK_ScimUsers_PlatformUsers', N'F') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.ScimUsers DROP CONSTRAINT FK_ScimUsers_PlatformUsers;
    END;

    ALTER TABLE dbo.ScimUsers DROP COLUMN PlatformUserId;
END;
GO

IF OBJECT_ID(N'dbo.IdentityUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IdentityUsers', N'PlatformUserId') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'FK_IdentityUsers_PlatformUsers', N'F') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.IdentityUsers DROP CONSTRAINT FK_IdentityUsers_PlatformUsers;
    END;

    ALTER TABLE dbo.IdentityUsers DROP COLUMN PlatformUserId;
END;
GO

IF OBJECT_ID(N'dbo.WorkspaceMemberships', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.WorkspaceMemberships;
END;
GO

IF OBJECT_ID(N'dbo.AuthenticationIdentities', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AuthenticationIdentities;
END;
GO

IF OBJECT_ID(N'dbo.PlatformUsers', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PlatformUsers;
END;
GO
