/*
  Rollback 326_DropUnusedFineTunedModelRegistryEntries.sql —
  recreate empty table shell (no row restore). Matches 267 CREATE shape.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.FineTunedModelRegistryEntries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FineTunedModelRegistryEntries
    (
        RegistryEntryId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                     UNIQUEIDENTIFIER NOT NULL,
        AzureFineTuningJobId         NVARCHAR(128)    NOT NULL,
        BaseModelDeploymentName      NVARCHAR(128)    NOT NULL,
        FineTunedModelDeploymentName NVARCHAR(128)    NULL,
        Status                       NVARCHAR(32)     NOT NULL,
        EvalSupportRatio             FLOAT            NULL,
        IsActive                     BIT              NOT NULL
            CONSTRAINT DF_FineTunedModelRegistryEntries_IsActive DEFAULT (0),
        CreatedUtc                   DATETIME2(7)     NOT NULL
            CONSTRAINT DF_FineTunedModelRegistryEntries_CreatedUtc DEFAULT SYSUTCDATETIME(),
        PromotedUtc                  DATETIME2(7)     NULL,
        RolledBackUtc                DATETIME2(7)     NULL,
        CONSTRAINT PK_FineTunedModelRegistryEntries PRIMARY KEY (RegistryEntryId)
    );

    CREATE INDEX IX_FineTunedModelRegistryEntries_TenantId_IsActive
        ON dbo.FineTunedModelRegistryEntries (TenantId, IsActive)
        WHERE IsActive = 1;
END;
GO
