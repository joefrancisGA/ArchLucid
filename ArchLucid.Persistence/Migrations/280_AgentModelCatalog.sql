/*
  280: Platform agent model catalog (TB-2103) + per-task evaluation evidence (TB-2105).
  Global catalog — not tenant-scoped. Internal admin curation; tenant APIs expose alias ids only.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.AgentModelCatalogEntry', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentModelCatalogEntry
    (
        AliasId                  NVARCHAR(128) NOT NULL
            CONSTRAINT PK_AgentModelCatalogEntry PRIMARY KEY,
        ProviderConnectionKind   NVARCHAR(128) NOT NULL,
        DeploymentName           NVARCHAR(260) NULL,
        TierBinding              NVARCHAR(32) NULL,
        CapabilityTagsJson       NVARCHAR(MAX) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_CapabilityTagsJson DEFAULT (N'[]'),
        ApprovedTaskTypesJson    NVARCHAR(MAX) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_ApprovedTaskTypesJson DEFAULT (N'[]'),
        StructuredOutputLevel    NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_StructuredOutputLevel DEFAULT (N'StrictJsonSchema'),
        DataBoundary             NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_DataBoundary DEFAULT (N'AzureBoundary'),
        LifecycleStatus          NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_LifecycleStatus DEFAULT (N'Available'),
        StructuredOutputProbeUtc DATETIME2(7) NULL,
        CreatedUtc               DATETIME2(7) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc               DATETIME2(7) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_UpdatedUtc DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.AgentModelCatalogEvaluation', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentModelCatalogEvaluation
    (
        AgentModelCatalogEvaluationId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_AgentModelCatalogEvaluation PRIMARY KEY,
        AliasId                     NVARCHAR(128) NOT NULL,
        TaskType                    NVARCHAR(128) NOT NULL,
        EvaluationState             NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEvaluation_EvaluationState DEFAULT (N'NotEvaluated'),
        EvidenceJson                NVARCHAR(MAX) NULL,
        EvaluatedUtc                DATETIME2(7) NULL,
        CONSTRAINT FK_AgentModelCatalogEvaluation_Entry
            FOREIGN KEY (AliasId) REFERENCES dbo.AgentModelCatalogEntry (AliasId),
        CONSTRAINT UQ_AgentModelCatalogEvaluation_AliasTask UNIQUE (AliasId, TaskType)
    );

    CREATE NONCLUSTERED INDEX IX_AgentModelCatalogEvaluation_AliasId
        ON dbo.AgentModelCatalogEvaluation (AliasId);
END;
GO
