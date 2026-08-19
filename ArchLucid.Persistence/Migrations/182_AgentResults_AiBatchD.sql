-- AI Batch D: calibrated agent confidence, curated evidence proposals, calibration samples, promoted catalog entries.

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentResults', N'CalibratedConfidence') IS NULL
        ALTER TABLE dbo.AgentResults ADD CalibratedConfidence FLOAT NULL;

    IF COL_LENGTH(N'dbo.AgentResults', N'ProposedEvidenceJson') IS NULL
        ALTER TABLE dbo.AgentResults ADD ProposedEvidenceJson NVARCHAR(MAX) NULL;
END

IF OBJECT_ID(N'dbo.AgentOutputCalibrationSamples', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentOutputCalibrationSamples
    (
        SampleId       UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_AgentOutputCalibrationSamples_SampleId DEFAULT (NEWSEQUENTIALID()),
        AgentType      NVARCHAR(50)     NOT NULL,
        RawConfidence  FLOAT            NOT NULL,
        SemanticScore  FLOAT            NOT NULL,
        CreatedUtc     DATETIME2        NOT NULL,
        CONSTRAINT PK_AgentOutputCalibrationSamples PRIMARY KEY (SampleId)
    );

    CREATE NONCLUSTERED INDEX IX_AgentOutputCalibrationSamples_AgentType_CreatedUtc
        ON dbo.AgentOutputCalibrationSamples (AgentType, CreatedUtc DESC);
END

IF OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantCuratedEvidenceEntries
    (
        EntryId          UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_TenantCuratedEvidenceEntries_EntryId DEFAULT (NEWSEQUENTIALID()),
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        EntryType        NVARCHAR(32)     NOT NULL,
        CatalogEntryId   NVARCHAR(128)    NOT NULL,
        Title            NVARCHAR(512)    NOT NULL,
        Description      NVARCHAR(MAX)    NOT NULL,
        Rationale        NVARCHAR(MAX)    NULL,
        SourceResultId   NVARCHAR(64)     NULL,
        PromotedUtc      DATETIME2        NOT NULL,
        CONSTRAINT PK_TenantCuratedEvidenceEntries PRIMARY KEY (EntryId)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_TenantCuratedEvidenceEntries_Tenant_CatalogEntryId
        ON dbo.TenantCuratedEvidenceEntries (TenantId, CatalogEntryId);

    CREATE NONCLUSTERED INDEX IX_TenantCuratedEvidenceEntries_TenantId_PromotedUtc
        ON dbo.TenantCuratedEvidenceEntries (TenantId, PromotedUtc DESC);
END
