/*
  103: Weekly sponsor digest email preferences (per-tenant schedule + recipients).

  RLS: not applied — tenant id is the sole scope; API enforces caller tenant via IScopeContextProvider.
*/
IF OBJECT_ID(N'dbo.TenantSponsorDigestPreferences', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSponsorDigestPreferences
    (
        TenantId                    UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantSponsorDigestPreferences PRIMARY KEY,
        SchemaVersion               INT              NOT NULL
            CONSTRAINT DF_TenantSponsorDigestPreferences_SchemaVersion DEFAULT 1,
        EmailEnabled                BIT              NOT NULL
            CONSTRAINT DF_TenantSponsorDigestPreferences_EmailEnabled DEFAULT 0,
        RecipientEmails             NVARCHAR(2000) NULL,
        IanaTimeZoneId              NVARCHAR(128)  NOT NULL
            CONSTRAINT DF_TenantSponsorDigestPreferences_Tz DEFAULT N'UTC',
        DayOfWeek                   TINYINT          NOT NULL
            CONSTRAINT DF_TenantSponsorDigestPreferences_Dow DEFAULT 1,
        HourOfDay                   TINYINT          NOT NULL
            CONSTRAINT DF_TenantSponsorDigestPreferences_Hour DEFAULT 8,
        UpdatedUtc                  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantSponsorDigestPreferences_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_TenantSponsorDigestPreferences_Dow CHECK (DayOfWeek BETWEEN 0 AND 6),
        CONSTRAINT CK_TenantSponsorDigestPreferences_Hour CHECK (HourOfDay BETWEEN 0 AND 23),
        CONSTRAINT FK_TenantSponsorDigestPreferences_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO
