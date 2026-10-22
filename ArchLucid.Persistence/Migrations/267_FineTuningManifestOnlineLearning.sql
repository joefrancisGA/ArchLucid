/*
  267: Manifest online fine-tuning audit + model registry (TB-594 / RAG-V2-003 / ADR 0056).

  FineTuningTrainingExportAudits — written by SqlFineTuningTrainingExportAuditRepository.
  FineTunedModelRegistryEntries — schema reserved for SQL registry parity; V1 DI wires
  InMemoryFineTunedModelRegistry only (no Sql*FineTunedModelRegistry yet).
*/
IF OBJECT_ID(N'dbo.FineTuningTrainingExportAudits', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FineTuningTrainingExportAudits
    (
        ExportAuditId     UNIQUEIDENTIFIER NOT NULL,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL,
        ManifestCount     INT              NOT NULL,
        RecordCount       INT              NOT NULL,
        BundleContentHash CHAR(64)         NOT NULL,
        ConsentSnapshot   NVARCHAR(32)     NOT NULL,
        CreatedUtc        DATETIME2(7)     NOT NULL
            CONSTRAINT DF_FineTuningTrainingExportAudits_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_FineTuningTrainingExportAudits PRIMARY KEY (ExportAuditId)
    );

    CREATE INDEX IX_FineTuningTrainingExportAudits_TenantId_CreatedUtc
        ON dbo.FineTuningTrainingExportAudits (TenantId, CreatedUtc DESC);
END;
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
