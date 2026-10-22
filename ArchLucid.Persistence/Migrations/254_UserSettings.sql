/*
  254: Per-user key/value preferences (e.g. appearance theme).

  No TenantId — preferences are user-scoped, not tenant-wide. API enforces caller identity via IActorContext.GetActorId().
*/
IF OBJECT_ID(N'dbo.UserSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserSettings
    (
        UserId          NVARCHAR(256) NOT NULL,
        PreferenceKey   NVARCHAR(128) NOT NULL,
        PreferenceValue NVARCHAR(512) NOT NULL,
        UpdatedUtc      DATETIME2(7)  NOT NULL
            CONSTRAINT DF_UserSettings_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_UserSettings PRIMARY KEY (UserId, PreferenceKey)
    );
END;
GO
