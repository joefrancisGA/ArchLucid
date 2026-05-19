/*
  173: Per-tenant key/value settings (e.g. AgentOutput quality gate mode override).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.TenantSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSettings
    (
        TenantId     UNIQUEIDENTIFIER  NOT NULL,
        SettingKey   NVARCHAR(128)     NOT NULL,
        SettingValue NVARCHAR(512)     NOT NULL,
        UpdatedUtc   DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantSettings_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_TenantSettings PRIMARY KEY CLUSTERED (TenantId, SettingKey),
        CONSTRAINT FK_TenantSettings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO
