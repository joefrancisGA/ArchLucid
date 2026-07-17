/*
  285: Platform user auth version for ArchLucid-issued JWT invalidation after identity removal.
*/
IF COL_LENGTH(N'dbo.PlatformUsers', N'AuthVersion') IS NULL
BEGIN
    ALTER TABLE dbo.PlatformUsers
        ADD AuthVersion UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_PlatformUsers_AuthVersion DEFAULT NEWSEQUENTIALID();
END;
GO
