-- 074: Idempotent trial seat tracking (one row per distinct principal per tenant).

IF OBJECT_ID(N'dbo.TenantTrialSeatOccupants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantTrialSeatOccupants
    (
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        PrincipalKey   NVARCHAR(450)    NOT NULL,
        CreatedUtc     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantTrialSeatOccupants_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_TenantTrialSeatOccupants PRIMARY KEY (TenantId, PrincipalKey),
        CONSTRAINT FK_TenantTrialSeatOccupants_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_TenantTrialSeatOccupants_TenantId
        ON dbo.TenantTrialSeatOccupants (TenantId);
END;
GO
