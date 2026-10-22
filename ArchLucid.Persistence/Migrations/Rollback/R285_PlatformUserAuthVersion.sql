/*
  R285: Rollback 285_PlatformUserAuthVersion.sql — drop platform user auth version column.
*/

IF COL_LENGTH(N'dbo.PlatformUsers', N'AuthVersion') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'DF_PlatformUsers_AuthVersion', N'D') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.PlatformUsers DROP CONSTRAINT DF_PlatformUsers_AuthVersion;
    END;

    ALTER TABLE dbo.PlatformUsers DROP COLUMN AuthVersion;
END;
GO
