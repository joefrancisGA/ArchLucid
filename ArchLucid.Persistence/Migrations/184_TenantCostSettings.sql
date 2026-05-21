SET NOCOUNT ON;
GO

/* 184: Per-tenant ROI cost assumptions (architect hourly rate, average incident cost). */

IF OBJECT_ID(N'dbo.TenantCostSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantCostSettings
    (
        TenantId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantCostSettings PRIMARY KEY
            CONSTRAINT FK_TenantCostSettings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        ArchitectHourlyRateUsd DECIMAL(18, 2) NOT NULL,
        AverageIncidentCostUsd DECIMAL(18, 2) NOT NULL,
        UpdatedUtc DATETIME2(7) NOT NULL
            CONSTRAINT DF_TenantCostSettings_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedByActorId NVARCHAR(256) NULL,
        CONSTRAINT CK_TenantCostSettings_ArchitectHourlyRateUsd
            CHECK (ArchitectHourlyRateUsd > 0 AND ArchitectHourlyRateUsd <= 10000),
        CONSTRAINT CK_TenantCostSettings_AverageIncidentCostUsd
            CHECK (AverageIncidentCostUsd > 0 AND AverageIncidentCostUsd <= 10000000)
    );
END;
GO
