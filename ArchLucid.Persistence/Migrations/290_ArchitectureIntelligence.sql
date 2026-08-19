-- TB-1976 / TB-1977: closed-loop architecture reasoning — immutable source layer + knowledge model (additive lane).
-- Does not alter sealed-evidence / GoldenManifest tables.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ArchitectureIntelligenceSources' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ArchitectureIntelligenceSources
    (
        ArtifactId NVARCHAR(64) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        ContentSha256 CHAR(64) NOT NULL,
        ContentType NVARCHAR(128) NOT NULL,
        FileName NVARCHAR(512) NULL,
        OwnershipClass TINYINT NOT NULL,
        Version INT NOT NULL CONSTRAINT DF_ArchitectureIntelligenceSources_Version DEFAULT (1),
        BlobUri NVARCHAR(1024) NULL,
        ContentVarBinary VARBINARY(MAX) NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_ArchitectureIntelligenceSources_MetadataJson DEFAULT (N'{}'),
        CreatedUtc DATETIME2 NOT NULL CONSTRAINT DF_ArchitectureIntelligenceSources_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_ArchitectureIntelligenceSources PRIMARY KEY (ArtifactId),
        CONSTRAINT CK_ArchitectureIntelligenceSources_OwnershipClass CHECK (OwnershipClass IN (0, 1, 2)),
        CONSTRAINT CK_ArchitectureIntelligenceSources_Sha256 CHECK (ContentSha256 LIKE '[0-9a-f][0-9a-f]%' AND LEN(ContentSha256) = 64)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ArchitectureIntelligenceSources_Tenant_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.ArchitectureIntelligenceSources'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureIntelligenceSources_Tenant_CreatedUtc
        ON dbo.ArchitectureIntelligenceSources (TenantId, CreatedUtc DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ArchitectureIntelligenceSources_Tenant_Sha256'
      AND object_id = OBJECT_ID(N'dbo.ArchitectureIntelligenceSources'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureIntelligenceSources_Tenant_Sha256
        ON dbo.ArchitectureIntelligenceSources (TenantId, ContentSha256);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ArchitectureKnowledgeModels' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ArchitectureKnowledgeModels
    (
        ModelId NVARCHAR(64) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        RunId NVARCHAR(64) NULL,
        SchemaVersion INT NOT NULL CONSTRAINT DF_ArchitectureKnowledgeModels_SchemaVersion DEFAULT (1),
        ElementsJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_ArchitectureKnowledgeModels_ElementsJson DEFAULT (N'[]'),
        DeclaredPrioritiesJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_ArchitectureKnowledgeModels_PrioritiesJson DEFAULT (N'[]'),
        FramingAnswersJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_ArchitectureKnowledgeModels_FramingJson DEFAULT (N'{}'),
        CreatedUtc DATETIME2 NOT NULL CONSTRAINT DF_ArchitectureKnowledgeModels_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc DATETIME2 NOT NULL CONSTRAINT DF_ArchitectureKnowledgeModels_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_ArchitectureKnowledgeModels PRIMARY KEY (ModelId)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ArchitectureKnowledgeModels_Tenant_UpdatedUtc'
      AND object_id = OBJECT_ID(N'dbo.ArchitectureKnowledgeModels'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureKnowledgeModels_Tenant_UpdatedUtc
        ON dbo.ArchitectureKnowledgeModels (TenantId, UpdatedUtc DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ArchitectureKnowledgeModels_Tenant_RunId'
      AND object_id = OBJECT_ID(N'dbo.ArchitectureKnowledgeModels'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureKnowledgeModels_Tenant_RunId
        ON dbo.ArchitectureKnowledgeModels (TenantId, RunId)
        WHERE RunId IS NOT NULL;
END
GO
