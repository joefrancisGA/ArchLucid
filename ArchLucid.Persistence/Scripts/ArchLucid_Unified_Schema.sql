/*
  ArchLucid_Unified_Schema.sql

  GENERATED FILE — DO NOT EDIT BY HAND. Edit ArchLucid.Persistence/Scripts/ArchLucid.sql and
  regenerate; CI fails when this file drifts from generator output (check_archlucid_unified_schema_snapshot).

  REFERENCE AND IaC ALIGNMENT ONLY. This script is NOT executed by DbUp, SqlSchemaBootstrapper,
  or deployment pipelines unless you deliberately wire it yourself.

  PURPOSE
    Consolidated declarative DDL (CREATE TABLE, CREATE INDEX, ALTER TABLE batches only) reflecting
    the final schema shape after sequential application of forward DbUp migrations
    ArchLucid.Persistence/Migrations/001_*.sql … 352_*.sql (excluding Rollback/).

  HOW THIS ARTIFACT RELATES TO MIGRATIONS
    Forward migrations remain the authoritative upgrade path on existing databases.
    This file is mechanically derived from ArchLucid.Persistence/Scripts/ArchLucid.sql—the same master
    greenfield DDL that CI requires to co-change with forward migrations—and therefore matches the
    final desired relational object model those migrations converge on.

    Regenerate after ArchLucid.sql changes:
      python scripts/ci/build_archlucid_unified_schema_sql.py

  OMITTED BATCH TYPES (present in ArchLucid.sql but not IaC-declarative table/index/column DDL here)
    RLS EXEC blocks, DENY/GRANT, standalone stored procedures/functions, EXEC-only batches, SET
    without accompanying DDL where applicable.

  SET ANSI_NULLS ON;
  SET QUOTED_IDENTIFIER ON;
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---- Core ---- */

IF OBJECT_ID(N'dbo.ArchitectureRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureRequests
    (
        RequestId            NVARCHAR(64)  NOT NULL PRIMARY KEY,
        SystemName           NVARCHAR(200) NOT NULL,
        Environment          NVARCHAR(50)  NOT NULL,
        CloudProvider        NVARCHAR(50)  NOT NULL,
        RequestJson          NVARCHAR(MAX) NOT NULL,
        CreatedUtc           DATETIME2     NOT NULL
    );
END

GO

/* ---- Agents (RunId UNIQUEIDENTIFIER: greenfield CREATE; legacy NVARCHAR catalogs migrate via DbUp 203–210) ---- */

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentTasks
    (
        TaskId             NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId              UNIQUEIDENTIFIER NOT NULL,
        AgentType          NVARCHAR(50)  NOT NULL,
        Objective          NVARCHAR(MAX) NOT NULL,
        Status             NVARCHAR(50)  NOT NULL,
        CreatedUtc         DATETIME2     NOT NULL,
        CompletedUtc       DATETIME2     NULL,
        EvidenceBundleRef  NVARCHAR(64)  NULL,
        INDEX IX_AgentTasks_RunId NONCLUSTERED (RunId),
        INDEX IX_AgentTasks_RunId_AgentType NONCLUSTERED (RunId, AgentType)
    );
END

GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentResults
    (
        ResultId   NVARCHAR(64)  NOT NULL PRIMARY KEY,
        TaskId     NVARCHAR(64)  NOT NULL,
        RunId      UNIQUEIDENTIFIER NOT NULL,
        AgentType  NVARCHAR(50)  NOT NULL,
        Confidence FLOAT         NOT NULL,
        ResultJson NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentResults_Task FOREIGN KEY (TaskId) REFERENCES dbo.AgentTasks (TaskId),
        INDEX IX_AgentResults_RunId NONCLUSTERED (RunId),
        INDEX IX_AgentResults_TaskId NONCLUSTERED (TaskId),
        INDEX IX_AgentResults_CreatedUtc NONCLUSTERED (CreatedUtc DESC)
    );
END

GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentResults_Task')
        ALTER TABLE dbo.AgentResults ADD CONSTRAINT FK_AgentResults_Task FOREIGN KEY (TaskId)
            REFERENCES dbo.AgentTasks (TaskId);
END

GO

/* ---- Manifest / evidence ---- */
/* dbo.GoldenManifestVersions removed — ADR 0030 PR A4 (migration 111). Coordinator-shaped manifests persist via dbo.GoldenManifests. */
/* dbo.DecisionTraces removed — migration 296; authority rule audits persist via dbo.DecisioningTraces. */
/* dbo.FineTunedModelRegistryEntries removed — migration 335 (reserved, never written; V1 uses InMemoryFineTunedModelRegistry). */

IF OBJECT_ID(N'dbo.EvidenceBundles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EvidenceBundles
    (
        EvidenceBundleId   NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RequestDescription NVARCHAR(MAX) NOT NULL,
        EvidenceJson       NVARCHAR(MAX) NOT NULL,
        CreatedUtc         DATETIME2     NOT NULL
    );
END

GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentEvidencePackages
    (
        EvidencePackageId NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId             UNIQUEIDENTIFIER NOT NULL,
        RequestId         NVARCHAR(64)  NOT NULL,
        SystemName        NVARCHAR(200) NOT NULL,
        Environment       NVARCHAR(50)  NOT NULL,
        CloudProvider     NVARCHAR(50)  NOT NULL,
        EvidenceJson      NVARCHAR(MAX) NOT NULL,
        CreatedUtc        DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentEvidencePackages_Request FOREIGN KEY (RequestId)
            REFERENCES dbo.ArchitectureRequests (RequestId),
        INDEX IX_AgentEvidencePackages_RunId NONCLUSTERED (RunId)
    );
END

GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvidencePackages_Request')
        ALTER TABLE dbo.AgentEvidencePackages ADD CONSTRAINT FK_AgentEvidencePackages_Request
            FOREIGN KEY (RequestId) REFERENCES dbo.ArchitectureRequests (RequestId);
END

GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentExecutionTraces
    (
        TraceId        NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId          UNIQUEIDENTIFIER NOT NULL,
        TaskId         NVARCHAR(64)  NOT NULL,
        AgentType      NVARCHAR(50)  NOT NULL,
        ParseSucceeded BIT           NOT NULL,
        ErrorMessage   NVARCHAR(MAX) NULL,
        TraceJson      NVARCHAR(MAX) NOT NULL,
        CreatedUtc     DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentExecutionTraces_Task FOREIGN KEY (TaskId)
            REFERENCES dbo.AgentTasks (TaskId),
        INDEX IX_AgentExecutionTraces_RunId NONCLUSTERED (RunId),
        INDEX IX_AgentExecutionTraces_TaskId NONCLUSTERED (TaskId)
    );
END

GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentExecutionTraces_Task')
        ALTER TABLE dbo.AgentExecutionTraces ADD CONSTRAINT FK_AgentExecutionTraces_Task FOREIGN KEY (TaskId)
            REFERENCES dbo.AgentTasks (TaskId);
END

GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullSystemPromptBlobKey') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullSystemPromptBlobKey NVARCHAR(2048) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullUserPromptBlobKey') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullUserPromptBlobKey NVARCHAR(2048) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullResponseBlobKey') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullResponseBlobKey NVARCHAR(2048) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ModelDeploymentName') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ModelDeploymentName NVARCHAR(260) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ModelVersion') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ModelVersion NVARCHAR(200) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'BlobUploadFailed') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD BlobUploadFailed BIT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullSystemPromptInline') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullSystemPromptInline NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullUserPromptInline') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullUserPromptInline NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'FullResponseInline') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD FullResponseInline NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'InlineFallbackFailed') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD InlineFallbackFailed BIT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'SystemPromptContentHash') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD SystemPromptContentHash NVARCHAR(32) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ProvenanceCorrelationId') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ProvenanceCorrelationId NVARCHAR(260) NULL;
END

GO

/* Brownfield: soft-archive on dbo.AgentExecutionTraces (DbUp 073 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentExecutionTraces', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.AgentExecutionTraces ADD ArchivedUtc DATETIME2 NULL;

GO

/* Brownfield: TB-931 hot scalars for cost/list projections (DbUp 294 parity). */
IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'InputTokenCount') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD InputTokenCount INT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'OutputTokenCount') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD OutputTokenCount INT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ReasoningTokenCount') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ReasoningTokenCount INT NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'EstimatedCostUsd') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD EstimatedCostUsd DECIMAL(18, 6) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ModelAlias') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD ModelAlias NVARCHAR(260) NULL;

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityWarning') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD QualityWarning BIT NOT NULL
            CONSTRAINT DF_AgentExecutionTraces_QualityWarning DEFAULT (0);

    IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'QualityRejected') IS NULL
        ALTER TABLE dbo.AgentExecutionTraces ADD QualityRejected BIT NOT NULL
            CONSTRAINT DF_AgentExecutionTraces_QualityRejected DEFAULT (0);
END

GO

/* ---- TechnologyLedgerEntries (canonical per-run technology facts; additive, unwired — DbUp 269) ---- */

IF OBJECT_ID(N'dbo.TechnologyLedgerEntries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TechnologyLedgerEntries
    (
        EntryId        NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId          UNIQUEIDENTIFIER NOT NULL,
        Role           NVARCHAR(32)     NOT NULL,
        TechnologyName NVARCHAR(200)    NOT NULL,
        ProviderFamily NVARCHAR(16)     NOT NULL,
        Status         NVARCHAR(16)     NOT NULL,
        Source         NVARCHAR(16)     NOT NULL,
        EvidenceRef    NVARCHAR(200)    NULL,
        Rationale      NVARCHAR(2000)   NULL,
        IsLocked       BIT              NOT NULL DEFAULT (0),
        CreatedUtc     DATETIME2(7)     NOT NULL,
        UpdatedUtc     DATETIME2(7)     NOT NULL,
        CONSTRAINT CK_TechnologyLedgerEntries_Role CHECK (Role IN (
            N'CloudPlatform', N'IdentityProvider', N'PrimaryDatastore', N'Messaging',
            N'ComputeRuntime', N'Region', N'IacTarget', N'Other')),
        CONSTRAINT CK_TechnologyLedgerEntries_ProviderFamily CHECK (ProviderFamily IN (
            N'None', N'Azure', N'Aws', N'Gcp')),
        CONSTRAINT CK_TechnologyLedgerEntries_Status CHECK (Status IN (
            N'Chosen', N'Assumed', N'Alternative', N'Future')),
        CONSTRAINT CK_TechnologyLedgerEntries_Source CHECK (Source IN (
            N'User', N'Evidence', N'AgentProposed')),
        INDEX IX_TechnologyLedgerEntries_RunId NONCLUSTERED (RunId),
        INDEX IX_TechnologyLedgerEntries_RunId_Role NONCLUSTERED (RunId, Role)
    );
END;

GO

/* ---- AgentOutputEvaluationResults (reference-case scores) ---- */

IF OBJECT_ID(N'dbo.AgentOutputEvaluationResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentOutputEvaluationResults
    (
        EvaluationId     UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_AgentOutputEvaluationResults_EvaluationId DEFAULT (NEWSEQUENTIALID()),
        RunId            NVARCHAR(64)     NOT NULL,
        TraceId          NVARCHAR(64)     NOT NULL,
        CaseId           NVARCHAR(128)    NOT NULL,
        AgentType        NVARCHAR(50)     NOT NULL,
        OverallScore     FLOAT            NOT NULL,
        StructuralMatch  FLOAT            NULL,
        SemanticMatch    FLOAT            NULL,
        MissingKeysJson  NVARCHAR(MAX)    NULL,
        CreatedUtc       DATETIME2        NOT NULL,
        CONSTRAINT PK_AgentOutputEvaluationResults PRIMARY KEY (EvaluationId)
    );

    CREATE NONCLUSTERED INDEX IX_AgentOutputEvaluationResults_RunId_CreatedUtc
        ON dbo.AgentOutputEvaluationResults (RunId, CreatedUtc DESC);
END

GO

/* ---- AI batch D: calibrated confidence, evidence proposals, promoted catalog (migration 182 / 244) ---- */

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentResults', N'CalibratedConfidence') IS NULL
        ALTER TABLE dbo.AgentResults ADD CalibratedConfidence FLOAT NULL;

    IF COL_LENGTH(N'dbo.AgentResults', N'ProposedEvidenceJson') IS NULL
        ALTER TABLE dbo.AgentResults ADD ProposedEvidenceJson NVARCHAR(MAX) NULL;

    IF COL_LENGTH(N'dbo.AgentResults', N'EvidenceProposalPromotedUtc') IS NULL
        ALTER TABLE dbo.AgentResults ADD EvidenceProposalPromotedUtc DATETIME2 NULL;

    IF COL_LENGTH(N'dbo.AgentResults', N'TaskStructuralExecutionMode') IS NULL
        ALTER TABLE dbo.AgentResults ADD TaskStructuralExecutionMode TINYINT NULL;

    IF COL_LENGTH(N'dbo.AgentResults', N'CacheServed') IS NULL
        ALTER TABLE dbo.AgentResults ADD CacheServed BIT NOT NULL
            CONSTRAINT DF_AgentResults_CacheServed DEFAULT (0);
END

GO

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

GO

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

    CREATE UNIQUE NONCLUSTERED INDEX UX_TenantCuratedEvidenceEntries_Tenant_SourceResultId
        ON dbo.TenantCuratedEvidenceEntries (TenantId, SourceResultId)
        WHERE SourceResultId IS NOT NULL;
END

GO

IF OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_TenantCuratedEvidenceEntries_Tenant_SourceResultId'
         AND object_id = OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TenantCuratedEvidenceEntries_Tenant_SourceResultId
        ON dbo.TenantCuratedEvidenceEntries (TenantId, SourceResultId)
        WHERE SourceResultId IS NOT NULL;
END

GO

/* ---- RunExportRecords: create or extend ---- */

IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RunExportRecords
    (
        ExportRecordId               NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RunId                        NVARCHAR(64)  NOT NULL,
        ExportType                   NVARCHAR(100) NOT NULL,
        Format                       NVARCHAR(50)  NOT NULL,
        FileName                     NVARCHAR(260) NOT NULL,
        TemplateProfile              NVARCHAR(100) NULL,
        TemplateProfileDisplayName   NVARCHAR(200) NULL,
        WasAutoSelected              BIT           NOT NULL,
        ResolutionReason             NVARCHAR(MAX) NULL,
        ManifestVersion              NVARCHAR(100) NULL,
        Notes                        NVARCHAR(MAX) NULL,
        AnalysisRequestJson          NVARCHAR(MAX) NULL,
        IncludedEvidence             BIT           NULL,
        IncludedExecutionTraces      BIT           NULL,
        IncludedManifest             BIT           NULL,
        IncludedDiagram              BIT           NULL,
        IncludedSummary              BIT           NULL,
        IncludedDeterminismCheck     BIT           NULL,
        DeterminismIterations        INT           NULL,
        IncludedManifestCompare      BIT           NULL,
        CompareManifestVersion       NVARCHAR(100) NULL,
        IncludedAgentResultCompare   BIT           NULL,
        CompareRunId                 NVARCHAR(64)  NULL,
        RecordJson                   NVARCHAR(MAX) NOT NULL,
        CreatedUtc                   DATETIME2     NOT NULL,
        INDEX IX_RunExportRecords_RunId NONCLUSTERED (RunId),
        INDEX IX_RunExportRecords_CreatedUtc NONCLUSTERED (CreatedUtc DESC)
    );
END

GO

/* RunExportRecords: full column set is in CREATE above (matches DbUp 001); no per-column ALTERs. */

/* ---- ComparisonRecords ---- */

IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ComparisonRecords
    (
        ComparisonRecordId    NVARCHAR(64)  NOT NULL PRIMARY KEY,
        ComparisonType        NVARCHAR(100) NOT NULL,
        LeftRunId             UNIQUEIDENTIFIER NULL,
        RightRunId            UNIQUEIDENTIFIER NULL,
        LeftManifestVersion   NVARCHAR(100) NULL,
        RightManifestVersion  NVARCHAR(100) NULL,
        LeftExportRecordId    NVARCHAR(64)  NULL,
        RightExportRecordId   NVARCHAR(64)  NULL,
        Format                NVARCHAR(50)  NOT NULL,
        SummaryMarkdown       NVARCHAR(MAX) NULL,
        PayloadJson           NVARCHAR(MAX) NOT NULL,
        Notes                 NVARCHAR(MAX) NULL,
        CreatedUtc            DATETIME2     NOT NULL,
        Label                 NVARCHAR(256) NULL,
        Tags                  NVARCHAR(MAX) NULL,
        INDEX IX_ComparisonRecords_LeftRunId NONCLUSTERED (LeftRunId),
        INDEX IX_ComparisonRecords_RightRunId NONCLUSTERED (RightRunId),
        INDEX IX_ComparisonRecords_LeftExportRecordId NONCLUSTERED (LeftExportRecordId),
        INDEX IX_ComparisonRecords_RightExportRecordId NONCLUSTERED (RightExportRecordId),
        INDEX IX_ComparisonRecords_ComparisonType_CreatedUtc NONCLUSTERED (ComparisonType, CreatedUtc DESC),
        INDEX IX_ComparisonRecords_Label NONCLUSTERED (Label) WHERE (Label IS NOT NULL)
    );
END

GO

/* Brownfield: soft-archive on dbo.ComparisonRecords (DbUp 073 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ComparisonRecords', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.ComparisonRecords ADD ArchivedUtc DATETIME2 NULL;

GO

/* ---- Decision Engine v2 ---- */

IF OBJECT_ID(N'dbo.DecisionNodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DecisionNodes
    (
        DecisionId       NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RunId            NVARCHAR(64)  NOT NULL,
        Topic            NVARCHAR(100) NOT NULL,
        SelectedOptionId NVARCHAR(64)  NULL,
        Confidence       FLOAT         NOT NULL,
        Rationale        NVARCHAR(MAX) NOT NULL,
        DecisionJson     NVARCHAR(MAX) NOT NULL,
        CreatedUtc       DATETIME2     NOT NULL,
        INDEX IX_DecisionNodes_RunId NONCLUSTERED (RunId),
        INDEX IX_DecisionNodes_CreatedUtc NONCLUSTERED (CreatedUtc DESC)
    );
END

GO

IF OBJECT_ID(N'dbo.AgentEvaluations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentEvaluations
    (
        EvaluationId       NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RunId              NVARCHAR(64)  NOT NULL,
        TargetAgentTaskId  NVARCHAR(64)  NOT NULL,
        EvaluationType     NVARCHAR(50)  NOT NULL,
        ConfidenceDelta    FLOAT         NOT NULL,
        Rationale          NVARCHAR(MAX) NOT NULL,
        EvaluationJson     NVARCHAR(MAX) NOT NULL,
        CreatedUtc         DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentEvaluations_Task FOREIGN KEY (TargetAgentTaskId)
            REFERENCES dbo.AgentTasks (TaskId),
        INDEX IX_AgentEvaluations_RunId NONCLUSTERED (RunId),
        INDEX IX_AgentEvaluations_TargetAgentTaskId NONCLUSTERED (TargetAgentTaskId)
    );
END

GO

IF OBJECT_ID(N'dbo.AgentEvaluations', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvaluations_Task')
        ALTER TABLE dbo.AgentEvaluations ADD CONSTRAINT FK_AgentEvaluations_Task FOREIGN KEY (TargetAgentTaskId)
            REFERENCES dbo.AgentTasks (TaskId);
END

GO

/* ---- Authority / Dapper persistence + Decisioning (GUID dbo.Runs) ---- */
/*
  Authority rule-audit traces live in dbo.DecisioningTraces (coordinator dbo.DecisionTraces dropped in migration 296).
  After ADR 0064 / DbUp 295, dbo.Runs may already exist as a synonym for dbo.Reviews — OBJECT_ID(...,'U') is NULL then,
  so also skip CREATE when any object (table or synonym) or the renamed base table is present.
*/

IF OBJECT_ID(N'dbo.Runs', N'U') IS NULL
   AND OBJECT_ID(N'dbo.Runs') IS NULL
   AND OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Runs
    (
        RunId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ProjectId NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ContextSnapshotId UNIQUEIDENTIFIER NULL,
        GraphSnapshotId UNIQUEIDENTIFIER NULL,
        FindingsSnapshotId UNIQUEIDENTIFIER NULL,
        GoldenManifestId UNIQUEIDENTIFIER NULL,
        DecisionTraceId UNIQUEIDENTIFIER NULL,
        ArtifactBundleId UNIQUEIDENTIFIER NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        ArchivedUtc DATETIME2 NULL,
        ArchitectureRequestId NVARCHAR(64) NULL,
        LegacyRunStatus NVARCHAR(64) NULL,
        CompletedUtc DATETIME2 NULL,
        CurrentManifestVersion NVARCHAR(128) NULL,
        OtelTraceId NVARCHAR(64) NULL,
        IsPublicShowcase BIT NOT NULL CONSTRAINT DF_Runs_IsPublicShowcase_Greenfield DEFAULT (0),
        IsDemoWelcomeRun BIT NOT NULL CONSTRAINT DF_Runs_IsDemoWelcomeRun_Greenfield DEFAULT (0),
        IsPinned BIT NOT NULL CONSTRAINT DF_Runs_IsPinned_Greenfield DEFAULT (0),
        IsSample BIT NOT NULL CONSTRAINT DF_Runs_IsSample_Greenfield DEFAULT (0),
        PackageOrigin NVARCHAR(16) NULL,
        StructuralExecutionMode NVARCHAR(32) NOT NULL CONSTRAINT DF_Runs_StructuralExecutionMode_Greenfield DEFAULT (N'Simulator'),
        CONSTRAINT CK_Runs_StructuralExecutionMode_Greenfield CHECK (StructuralExecutionMode IN (N'Simulator', N'Real', N'Fallback', N'Mixed')),
        RowVersionStamp ROWVERSION,
        INDEX IX_Runs_ProjectId_CreatedUtc NONCLUSTERED (ProjectId, CreatedUtc DESC)
    );
END;

GO

/* TB-006 / DbUp 137: ComparisonRecords run ids reference dbo.Runs once both tables exist. */
IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ComparisonRecords')
         AND c.name = N'LeftRunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_ComparisonRecords_Runs_LeftRunIdGuid'
          AND parent_object_id = OBJECT_ID(N'dbo.ComparisonRecords'))
        ALTER TABLE dbo.ComparisonRecords ADD CONSTRAINT FK_ComparisonRecords_Runs_LeftRunIdGuid FOREIGN KEY (LeftRunId)
            REFERENCES dbo.Runs (RunId);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_ComparisonRecords_Runs_RightRunIdGuid'
          AND parent_object_id = OBJECT_ID(N'dbo.ComparisonRecords'))
        ALTER TABLE dbo.ComparisonRecords ADD CONSTRAINT FK_ComparisonRecords_Runs_RightRunIdGuid FOREIGN KEY (RightRunId)
            REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'IsPublicShowcase') IS NULL
    ALTER TABLE dbo.Runs ADD IsPublicShowcase BIT NOT NULL CONSTRAINT DF_Runs_IsPublicShowcase DEFAULT (0);

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'IsDemoWelcomeRun') IS NULL
    ALTER TABLE dbo.Runs ADD IsDemoWelcomeRun BIT NOT NULL CONSTRAINT DF_Runs_IsDemoWelcomeRun DEFAULT (0);

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'IsPinned') IS NULL
    ALTER TABLE dbo.Runs ADD IsPinned BIT NOT NULL CONSTRAINT DF_Runs_IsPinned DEFAULT (0);

GO

-- IsSample marks demo/trial seeded runs eligible for the sample-run TTL purge (OS-1b);
-- referenced by the covering index below and by SqlRunRepository/DemoRunSqlPredicates.
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'IsSample') IS NULL
    ALTER TABLE dbo.Runs ADD IsSample BIT NOT NULL CONSTRAINT DF_Runs_IsSample DEFAULT (0);

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'PackageOrigin') IS NULL
    ALTER TABLE dbo.Runs ADD PackageOrigin NVARCHAR(16) NULL;

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.Runs ADD RowVersionStamp ROWVERSION;

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OtelTraceId') IS NULL
    ALTER TABLE dbo.Runs ADD OtelTraceId NVARCHAR(64) NULL;

GO

/* Brownfield: pilot try --real provenance (DbUp 114 parity). */
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'RealModeFellBackToSimulator') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD
        RealModeFellBackToSimulator BIT NOT NULL CONSTRAINT DF_Runs_RealModeFellBackToSimulatorArchLucidSql DEFAULT (0),
        PilotAoaiDeploymentSnapshot NVARCHAR(256) NULL;
END;

GO

/* INV-002 / DbUp 155: structural execution mode (NOT NULL, CHECK). */
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'StructuralExecutionMode') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD
        StructuralExecutionMode NVARCHAR(32) NOT NULL
            CONSTRAINT DF_Runs_StructuralExecutionModeArchLucidSql DEFAULT (N'Simulator'),
        CONSTRAINT CK_Runs_StructuralExecutionModeArchLucidSql CHECK (StructuralExecutionMode IN (N'Simulator', N'Real', N'Fallback', N'Mixed'));

    EXEC (N'UPDATE dbo.Runs SET StructuralExecutionMode = N''Fallback'' WHERE RealModeFellBackToSimulator = 1;');
END;

GO

/* Brownfield: run retry counters + failure reason (DbUp 128 parity). */
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'RetryCount') IS NULL
    ALTER TABLE dbo.Runs ADD RetryCount INT NOT NULL CONSTRAINT DF_Runs_RetryCount_Master DEFAULT (0);

/* Brownfield: run-level engine provenance JSON (DbUp 252 parity). */
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'EngineProvenanceJson') IS NULL
    ALTER TABLE dbo.Runs ADD EngineProvenanceJson NVARCHAR(MAX) NULL;

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'LastFailureReason') IS NULL
    ALTER TABLE dbo.Runs ADD LastFailureReason NVARCHAR(2000) NULL;

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_LegacyRunStatus')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_LegacyRunStatus
        CHECK (LegacyRunStatus IN (
            N'Created', N'TasksGenerated', N'WaitingForResults',
            N'ReadyForCommit', N'Committed', N'Failed', N'Retrying')
              OR LegacyRunStatus IS NULL);

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_CommittedHasManifest')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM dbo.Runs WHERE LegacyRunStatus = N'Committed' AND GoldenManifestId IS NULL)
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_CommittedHasManifest
        CHECK (LegacyRunStatus <> N'Committed' OR GoldenManifestId IS NOT NULL);

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_CommittedHasCompletedUtc')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.Runs
        WHERE LegacyRunStatus IN (N'Committed', N'Failed')
          AND CompletedUtc IS NULL)
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_CommittedHasCompletedUtc
        CHECK (LegacyRunStatus NOT IN (N'Committed', N'Failed') OR CompletedUtc IS NOT NULL);

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_FailedNoManifest')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_FailedNoManifest
        CHECK (LegacyRunStatus <> N'Failed' OR GoldenManifestId IS NULL);

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Runs_FailedNoArtifact')
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
    ALTER TABLE dbo.Runs ADD CONSTRAINT CK_Runs_FailedNoArtifact
        CHECK (LegacyRunStatus <> N'Failed' OR ArtifactBundleId IS NULL);

GO

IF OBJECT_ID('dbo.ContextSnapshots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContextSnapshots
    (
        SnapshotId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        ProjectId NVARCHAR(200) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CanonicalObjectsJson NVARCHAR(MAX) NOT NULL,
        DeltaSummary NVARCHAR(MAX) NULL,
        WarningsJson NVARCHAR(MAX) NOT NULL,
        ErrorsJson NVARCHAR(MAX) NOT NULL,
        SourceHashesJson NVARCHAR(MAX) NOT NULL,
        INDEX IX_ContextSnapshots_ProjectId_CreatedUtc NONCLUSTERED (ProjectId, CreatedUtc DESC),
        INDEX IX_ContextSnapshots_RunId NONCLUSTERED (RunId)
    );
END;

GO

/* Brownfield: RLS scope denormalization (DbUp 046 parity) on dbo.ContextSnapshots */
IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.ContextSnapshots', N'TenantId') IS NULL
        ALTER TABLE dbo.ContextSnapshots ADD TenantId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.ContextSnapshots', N'WorkspaceId') IS NULL
        ALTER TABLE dbo.ContextSnapshots ADD WorkspaceId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.ContextSnapshots', N'ScopeProjectId') IS NULL
        ALTER TABLE dbo.ContextSnapshots ADD ScopeProjectId UNIQUEIDENTIFIER NULL;
END;

GO

/* Brownfield: soft-archive on dbo.ContextSnapshots (DbUp 067 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ContextSnapshots', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.ContextSnapshots ADD ArchivedUtc DATETIME2 NULL;

GO

/* Relational expansion for dbo.ContextSnapshots (dual-write; legacy JSON columns retained). */
IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjects', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContextSnapshotCanonicalObjects
    (
        CanonicalObjectRowId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ContextSnapshotCanonicalObjects PRIMARY KEY,
        SnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        ObjectId NVARCHAR(450) NOT NULL,
        ObjectType NVARCHAR(200) NOT NULL,
        Name NVARCHAR(500) NOT NULL,
        SourceType NVARCHAR(200) NOT NULL,
        SourceId NVARCHAR(450) NOT NULL,
        CONSTRAINT FK_ContextSnapshotCanonicalObjects_ContextSnapshots FOREIGN KEY (SnapshotId)
            REFERENCES dbo.ContextSnapshots (SnapshotId) ON DELETE CASCADE,
        CONSTRAINT UQ_ContextSnapshotCanonicalObjects_Snapshot_Sort UNIQUE (SnapshotId, SortOrder)
    );

    CREATE NONCLUSTERED INDEX IX_ContextSnapshotCanonicalObjects_SnapshotId
        ON dbo.ContextSnapshotCanonicalObjects (SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjectProperties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContextSnapshotCanonicalObjectProperties
    (
        CanonicalObjectRowId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        PropertySortOrder INT NOT NULL,
        PropertyKey NVARCHAR(200) NOT NULL,
        PropertyValue NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_ContextSnapshotCanonicalObjectProperties PRIMARY KEY (CanonicalObjectRowId, PropertySortOrder),
        CONSTRAINT FK_ContextSnapshotCanonicalObjectProperties_Objects FOREIGN KEY (CanonicalObjectRowId)
            REFERENCES dbo.ContextSnapshotCanonicalObjects (CanonicalObjectRowId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ContextSnapshotCanonicalObjectProperties_Object
        ON dbo.ContextSnapshotCanonicalObjectProperties (CanonicalObjectRowId);
END;

GO

IF OBJECT_ID(N'dbo.ContextSnapshotWarnings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContextSnapshotWarnings
    (
        SnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        WarningText NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_ContextSnapshotWarnings PRIMARY KEY (SnapshotId, SortOrder),
        CONSTRAINT FK_ContextSnapshotWarnings_ContextSnapshots FOREIGN KEY (SnapshotId)
            REFERENCES dbo.ContextSnapshots (SnapshotId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ContextSnapshotWarnings_SnapshotId
        ON dbo.ContextSnapshotWarnings (SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.ContextSnapshotErrors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContextSnapshotErrors
    (
        SnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        ErrorText NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_ContextSnapshotErrors PRIMARY KEY (SnapshotId, SortOrder),
        CONSTRAINT FK_ContextSnapshotErrors_ContextSnapshots FOREIGN KEY (SnapshotId)
            REFERENCES dbo.ContextSnapshots (SnapshotId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ContextSnapshotErrors_SnapshotId
        ON dbo.ContextSnapshotErrors (SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.ContextSnapshotSourceHashes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContextSnapshotSourceHashes
    (
        SnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        SourceKey NVARCHAR(450) NOT NULL,
        HashValue NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_ContextSnapshotSourceHashes PRIMARY KEY (SnapshotId, SortOrder),
        CONSTRAINT FK_ContextSnapshotSourceHashes_ContextSnapshots FOREIGN KEY (SnapshotId)
            REFERENCES dbo.ContextSnapshots (SnapshotId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ContextSnapshotSourceHashes_SnapshotId
        ON dbo.ContextSnapshotSourceHashes (SnapshotId);
END;

GO

IF OBJECT_ID('dbo.GraphSnapshots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GraphSnapshots
    (
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ContextSnapshotId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        NodesJson NVARCHAR(MAX) NULL,
        EdgesJson NVARCHAR(MAX) NULL,
        WarningsJson NVARCHAR(MAX) NULL,
        INDEX IX_GraphSnapshots_RunId NONCLUSTERED (RunId),
        INDEX IX_GraphSnapshots_ContextSnapshotId NONCLUSTERED (ContextSnapshotId)
    );
END;

GO

/* GraphSnapshots legacy JSON columns nullable (see Migrations/042_GraphSnapshots_LegacyJsonNullable.sql). */
IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.schema_id = SCHEMA_ID(N'dbo')
          AND t.name = N'GraphSnapshots'
          AND c.name = N'NodesJson'
          AND c.is_nullable = 0)
        ALTER TABLE dbo.GraphSnapshots ALTER COLUMN NodesJson NVARCHAR(MAX) NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.schema_id = SCHEMA_ID(N'dbo')
          AND t.name = N'GraphSnapshots'
          AND c.name = N'EdgesJson'
          AND c.is_nullable = 0)
        ALTER TABLE dbo.GraphSnapshots ALTER COLUMN EdgesJson NVARCHAR(MAX) NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.schema_id = SCHEMA_ID(N'dbo')
          AND t.name = N'GraphSnapshots'
          AND c.name = N'WarningsJson'
          AND c.is_nullable = 0)
        ALTER TABLE dbo.GraphSnapshots ALTER COLUMN WarningsJson NVARCHAR(MAX) NULL;
END;

GO

/* Brownfield: soft-archive on dbo.GraphSnapshots (DbUp 067 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GraphSnapshots', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.GraphSnapshots ADD ArchivedUtc DATETIME2 NULL;

GO

IF OBJECT_ID('dbo.GraphSnapshotEdges', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GraphSnapshotEdges
    (
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        EdgeId            NVARCHAR(200) NOT NULL,
        FromNodeId        NVARCHAR(500) NOT NULL,
        ToNodeId          NVARCHAR(500) NOT NULL,
        EdgeType          NVARCHAR(100) NOT NULL,
        Weight            FLOAT NOT NULL
            CONSTRAINT DF_GraphSnapshotEdges_Weight DEFAULT (1),
        CONSTRAINT PK_GraphSnapshotEdges PRIMARY KEY (GraphSnapshotId, EdgeId),
        CONSTRAINT FK_GraphSnapshotEdges_GraphSnapshots FOREIGN KEY (GraphSnapshotId)
            REFERENCES dbo.GraphSnapshots (GraphSnapshotId)
    );

    -- Key length must stay within SQL Server 1700-byte nonclustered index limit (avoid three wide NVARCHARs in the key).
    CREATE NONCLUSTERED INDEX IX_GraphSnapshotEdges_SnapshotFrom
        ON dbo.GraphSnapshotEdges (GraphSnapshotId, FromNodeId)
        INCLUDE (ToNodeId, EdgeType, Weight);
END;

GO

-- Relational children for GraphSnapshots (dual-write; JSON columns retained). GraphSnapshotEdges remains authoritative for indexed edge queries.
IF OBJECT_ID(N'dbo.GraphSnapshotNodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GraphSnapshotNodes
    (
        GraphNodeRowId   UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_GraphSnapshotNodes PRIMARY KEY,
        GraphSnapshotId  UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder        INT NOT NULL,
        NodeId           NVARCHAR(500) NOT NULL,
        NodeType         NVARCHAR(100) NOT NULL,
        Label            NVARCHAR(1000) NOT NULL,
        Category         NVARCHAR(200) NULL,
        SourceType       NVARCHAR(200) NULL,
        SourceId         NVARCHAR(500) NULL,
        CONSTRAINT FK_GraphSnapshotNodes_GraphSnapshots FOREIGN KEY (GraphSnapshotId)
            REFERENCES dbo.GraphSnapshots (GraphSnapshotId) ON DELETE CASCADE,
        CONSTRAINT UQ_GraphSnapshotNodes_Snapshot_Sort UNIQUE (GraphSnapshotId, SortOrder)
    );

    CREATE NONCLUSTERED INDEX IX_GraphSnapshotNodes_SnapshotId
        ON dbo.GraphSnapshotNodes (GraphSnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodeProperties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GraphSnapshotNodeProperties
    (
        GraphNodeRowId    UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        PropertySortOrder INT NOT NULL,
        PropertyKey       NVARCHAR(200) NOT NULL,
        PropertyValue     NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_GraphSnapshotNodeProperties PRIMARY KEY (GraphNodeRowId, PropertySortOrder),
        CONSTRAINT FK_GraphSnapshotNodeProperties_Nodes FOREIGN KEY (GraphNodeRowId)
            REFERENCES dbo.GraphSnapshotNodes (GraphNodeRowId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GraphSnapshotNodeProperties_Node
        ON dbo.GraphSnapshotNodeProperties (GraphNodeRowId);
END;

GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdgeProperties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GraphSnapshotEdgeProperties
    (
        GraphSnapshotId   UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        EdgeId            NVARCHAR(200) NOT NULL,
        PropertySortOrder INT NOT NULL,
        PropertyKey       NVARCHAR(200) NOT NULL,
        PropertyValue     NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_GraphSnapshotEdgeProperties PRIMARY KEY (GraphSnapshotId, EdgeId, PropertySortOrder),
        CONSTRAINT FK_GraphSnapshotEdgeProperties_Edges FOREIGN KEY (GraphSnapshotId, EdgeId)
            REFERENCES dbo.GraphSnapshotEdges (GraphSnapshotId, EdgeId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GraphSnapshotEdgeProperties_SnapshotId
        ON dbo.GraphSnapshotEdgeProperties (GraphSnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.GraphSnapshotWarnings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GraphSnapshotWarnings
    (
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        WarningText     NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_GraphSnapshotWarnings PRIMARY KEY (GraphSnapshotId, SortOrder),
        CONSTRAINT FK_GraphSnapshotWarnings_GraphSnapshots FOREIGN KEY (GraphSnapshotId)
            REFERENCES dbo.GraphSnapshots (GraphSnapshotId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GraphSnapshotWarnings_SnapshotId
        ON dbo.GraphSnapshotWarnings (GraphSnapshotId);
END;

GO

IF OBJECT_ID('dbo.FindingsSnapshots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingsSnapshots
    (
        FindingsSnapshotId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        ContextSnapshotId UNIQUEIDENTIFIER NOT NULL,
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        CreatedUtc DATETIME2 NOT NULL,
        SchemaVersion INT NOT NULL DEFAULT (1),
        FindingsJson NVARCHAR(MAX) NOT NULL,
        INDEX IX_FindingsSnapshots_RunId NONCLUSTERED (RunId),
        INDEX IX_FindingsSnapshots_ContextSnapshotId NONCLUSTERED (ContextSnapshotId),
        INDEX IX_FindingsSnapshots_GraphSnapshotId NONCLUSTERED (GraphSnapshotId)
    );
END;

GO

/* Brownfield: RLS scope denormalization (DbUp 046 parity) on dbo.FindingsSnapshots */
IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.FindingsSnapshots', N'TenantId') IS NULL
        ALTER TABLE dbo.FindingsSnapshots ADD TenantId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.FindingsSnapshots', N'WorkspaceId') IS NULL
        ALTER TABLE dbo.FindingsSnapshots ADD WorkspaceId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.FindingsSnapshots', N'ProjectId') IS NULL
        ALTER TABLE dbo.FindingsSnapshots ADD ProjectId UNIQUEIDENTIFIER NULL;
END;

GO

-- Brownfield: SchemaVersion on FindingsSnapshots (relational reads use header; JSON fallback still migrates in app).
IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'SchemaVersion') IS NULL
BEGIN
    ALTER TABLE dbo.FindingsSnapshots
        ADD SchemaVersion INT NOT NULL CONSTRAINT DF_FindingsSnapshots_SchemaVersion_Brownfield DEFAULT (1);
END;

GO

/* Brownfield: soft-archive on dbo.FindingsSnapshots (DbUp 066 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD ArchivedUtc DATETIME2 NULL;

GO

/* Brownfield: findings snapshot generation status (DbUp 127 parity). */
IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'GenerationStatus') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD GenerationStatus NVARCHAR(32) NOT NULL
        CONSTRAINT DF_FindingsSnapshots_GenerationStatus_Master DEFAULT (N'Complete');

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingsSnapshots_GenerationStatus')
   AND OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
    ALTER TABLE dbo.FindingsSnapshots ADD CONSTRAINT CK_FindingsSnapshots_GenerationStatus
        CHECK (GenerationStatus IN (N'Generating', N'Complete', N'PartiallyComplete', N'Failed'));

GO

/* Brownfield: denormalized warning flag for hot-path run list queries (SqlRunRepository / HotPathRelationalQueryShapes). */
IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'HasWarnings') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD HasWarnings BIT NOT NULL
        CONSTRAINT DF_FindingsSnapshots_HasWarnings_Master DEFAULT (0);

GO

/* Relational findings — greenfield CREATE TABLE parity with DbUp 129 (scope columns on child/authority-path tables).
   DbUp 129 backfills are brownfield-only; keep this file aligned with 129's final column layout. */
-- Relational findings (dual-write with FindingsJson; typed payload only in FindingRecords.PayloadJson).
IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingRecords
    (
        FindingRecordId     UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_FindingRecords PRIMARY KEY,
        FindingsSnapshotId  UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder           INT NOT NULL,
        FindingId           NVARCHAR(200) NOT NULL,
        FindingSchemaVersion INT NOT NULL,
        FindingType         NVARCHAR(200) NOT NULL,
        Category            NVARCHAR(200) NOT NULL,
        EngineType          NVARCHAR(200) NOT NULL,
        Severity            NVARCHAR(50) NOT NULL,
        Title               NVARCHAR(1000) NOT NULL,
        Rationale           NVARCHAR(MAX) NOT NULL,
        PayloadType         NVARCHAR(256) NULL,
        PayloadJson         NVARCHAR(MAX) NULL,
        CONSTRAINT FK_FindingRecords_FindingsSnapshots FOREIGN KEY (FindingsSnapshotId)
            REFERENCES dbo.FindingsSnapshots (FindingsSnapshotId) ON DELETE CASCADE,
        CONSTRAINT UQ_FindingRecords_Snapshot_Sort UNIQUE (FindingsSnapshotId, SortOrder)
    );

    CREATE NONCLUSTERED INDEX IX_FindingRecords_FindingsSnapshotId
        ON dbo.FindingRecords (FindingsSnapshotId);

    CREATE NONCLUSTERED INDEX IX_FindingRecords_Snapshot_Severity
        ON dbo.FindingRecords (FindingsSnapshotId, Severity, SortOrder)
        INCLUDE (FindingRecordId, FindingId, Category, EngineType, Title);

    CREATE NONCLUSTERED INDEX IX_FindingRecords_Snapshot_Category
        ON dbo.FindingRecords (FindingsSnapshotId, Category, SortOrder)
        INCLUDE (FindingRecordId, Severity, FindingType, Title);

    CREATE UNIQUE INDEX UQ_FindingRecords_Snapshot_FindingId
        ON dbo.FindingRecords (FindingsSnapshotId, FindingId);
END;

GO

/* Brownfield: Batch C / TB-087 — duplicate finding id guard per snapshot */
IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_FindingRecords_Snapshot_FindingId'
          AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
    CREATE UNIQUE INDEX UQ_FindingRecords_Snapshot_FindingId
        ON dbo.FindingRecords (FindingsSnapshotId, FindingId);

GO

IF OBJECT_ID(N'dbo.FindingRelatedNodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingRelatedNodes
    (
        FindingRecordId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        NodeId          NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_FindingRelatedNodes PRIMARY KEY (FindingRecordId, SortOrder),
        CONSTRAINT FK_FindingRelatedNodes_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingRelatedNodes_Record
        ON dbo.FindingRelatedNodes (FindingRecordId);
END;

GO

IF OBJECT_ID(N'dbo.FindingRecommendedActions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingRecommendedActions
    (
        FindingRecordId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        ActionText      NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_FindingRecommendedActions PRIMARY KEY (FindingRecordId, SortOrder),
        CONSTRAINT FK_FindingRecommendedActions_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingRecommendedActions_Record
        ON dbo.FindingRecommendedActions (FindingRecordId);
END;

GO

IF OBJECT_ID(N'dbo.FindingProperties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingProperties
    (
        FindingRecordId    UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        PropertySortOrder  INT NOT NULL,
        PropertyKey        NVARCHAR(200) NOT NULL,
        PropertyValue      NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_FindingProperties PRIMARY KEY (FindingRecordId, PropertySortOrder),
        CONSTRAINT FK_FindingProperties_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingProperties_Record
        ON dbo.FindingProperties (FindingRecordId);
END;

GO

IF OBJECT_ID(N'dbo.FindingTraceGraphNodesExamined', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingTraceGraphNodesExamined
    (
        FindingRecordId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        NodeId          NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_FindingTraceGraphNodesExamined PRIMARY KEY (FindingRecordId, SortOrder),
        CONSTRAINT FK_FindingTraceGraphNodesExamined_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingTraceGraphNodesExamined_Record
        ON dbo.FindingTraceGraphNodesExamined (FindingRecordId);
END;

GO

IF OBJECT_ID(N'dbo.FindingTraceRulesApplied', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingTraceRulesApplied
    (
        FindingRecordId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        RuleText        NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_FindingTraceRulesApplied PRIMARY KEY (FindingRecordId, SortOrder),
        CONSTRAINT FK_FindingTraceRulesApplied_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingTraceRulesApplied_Record
        ON dbo.FindingTraceRulesApplied (FindingRecordId);
END;

GO

IF OBJECT_ID(N'dbo.FindingTraceDecisionsTaken', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingTraceDecisionsTaken
    (
        FindingRecordId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        DecisionText    NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_FindingTraceDecisionsTaken PRIMARY KEY (FindingRecordId, SortOrder),
        CONSTRAINT FK_FindingTraceDecisionsTaken_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingTraceDecisionsTaken_Record
        ON dbo.FindingTraceDecisionsTaken (FindingRecordId);
END;

GO

IF OBJECT_ID(N'dbo.FindingTraceAlternativePaths', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingTraceAlternativePaths
    (
        FindingRecordId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        PathText        NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_FindingTraceAlternativePaths PRIMARY KEY (FindingRecordId, SortOrder),
        CONSTRAINT FK_FindingTraceAlternativePaths_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingTraceAlternativePaths_Record
        ON dbo.FindingTraceAlternativePaths (FindingRecordId);
END;

GO

IF OBJECT_ID(N'dbo.FindingTraceNotes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingTraceNotes
    (
        FindingRecordId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        NoteText        NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_FindingTraceNotes PRIMARY KEY (FindingRecordId, SortOrder),
        CONSTRAINT FK_FindingTraceNotes_FindingRecords FOREIGN KEY (FindingRecordId)
            REFERENCES dbo.FindingRecords (FindingRecordId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_FindingTraceNotes_Record
        ON dbo.FindingTraceNotes (FindingRecordId);
END;

GO

/* Brownfield: finding provenance + human review (121) and imported request drafts (122). */
IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'RequestInputRef') IS NULL
    ALTER TABLE dbo.FindingRecords ADD RequestInputRef NVARCHAR(64) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'RunIdRef') IS NULL
    ALTER TABLE dbo.FindingRecords ADD RunIdRef NVARCHAR(64) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'AgentExecutionTraceId') IS NULL
    ALTER TABLE dbo.FindingRecords ADD AgentExecutionTraceId NVARCHAR(32) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ModelDeploymentName') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ModelDeploymentName NVARCHAR(200) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ModelVersion') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ModelVersion NVARCHAR(200) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'PromptTemplateId') IS NULL
    ALTER TABLE dbo.FindingRecords ADD PromptTemplateId NVARCHAR(200) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'PromptTemplateVersion') IS NULL
    ALTER TABLE dbo.FindingRecords ADD PromptTemplateVersion NVARCHAR(100) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ConfidenceScore') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ConfidenceScore FLOAT NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'EvaluationConfidenceScore') IS NULL
    ALTER TABLE dbo.FindingRecords ADD EvaluationConfidenceScore INT NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'EvaluationConfidenceLevel') IS NULL
    ALTER TABLE dbo.FindingRecords ADD EvaluationConfidenceLevel NVARCHAR(20) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'PolicyRuleId') IS NULL
    ALTER TABLE dbo.FindingRecords ADD PolicyRuleId NVARCHAR(500) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'HumanReviewStatus') IS NULL
    ALTER TABLE dbo.FindingRecords
        ADD HumanReviewStatus NVARCHAR(50) NOT NULL CONSTRAINT DF_FindingRecords_HumanReview_Master DEFAULT (N'NotRequired');

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ReviewedByUserId') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ReviewedByUserId NVARCHAR(256) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ReviewedAtUtc') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ReviewedAtUtc DATETIME2 NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ReviewNotes') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ReviewNotes NVARCHAR(MAX) NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'IsMuted') IS NULL
    ALTER TABLE dbo.FindingRecords
        ADD IsMuted BIT NOT NULL CONSTRAINT DF_FindingRecords_IsMuted_Master DEFAULT (0);

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'MuteReason') IS NULL
    ALTER TABLE dbo.FindingRecords ADD MuteReason NVARCHAR(2000) NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ReasoningTrace') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ReasoningTrace NVARCHAR(2000) NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'ReasoningTraceDigestSha256') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ReasoningTraceDigestSha256 NVARCHAR(64) NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'InsightDensityScore') IS NULL
    ALTER TABLE dbo.FindingRecords ADD InsightDensityScore INT NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'Treatment') IS NULL
    ALTER TABLE dbo.FindingRecords ADD Treatment TINYINT NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'Classification') IS NULL
    ALTER TABLE dbo.FindingRecords ADD Classification TINYINT NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'WhyThisIsNotGeneric') IS NULL
    ALTER TABLE dbo.FindingRecords ADD WhyThisIsNotGeneric NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'PrincipalArchitectValue') IS NULL
    ALTER TABLE dbo.FindingRecords ADD PrincipalArchitectValue NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'DecisionConsequence') IS NULL
    ALTER TABLE dbo.FindingRecords ADD DecisionConsequence NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingsSnapshots', N'ChecklistCoverageJson') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD ChecklistCoverageJson NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingsSnapshots', N'InsightDensityDemotedCount') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD InsightDensityDemotedCount INT NULL;

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingsSnapshots', N'InsightDensityRetainedCount') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD InsightDensityRetainedCount INT NULL;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'MuteExpiresAtUtc') IS NULL
    ALTER TABLE dbo.FindingRecords ADD MuteExpiresAtUtc DATETIME2(3) NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'AssignedToUserId') IS NULL
    ALTER TABLE dbo.FindingRecords ADD AssignedToUserId NVARCHAR(256) NULL;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.FindingRecords', N'RemediationDueUtc') IS NULL
    ALTER TABLE dbo.FindingRecords ADD RemediationDueUtc DATETIME2(3) NULL;

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_ReviewedByWhenReviewed')
   AND OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.FindingRecords
        WHERE HumanReviewStatus IN (N'Approved', N'Rejected', N'Overridden')
          AND ReviewedByUserId IS NULL)
    ALTER TABLE dbo.FindingRecords ADD CONSTRAINT CK_FindingRecords_ReviewedByWhenReviewed
        CHECK (
            HumanReviewStatus NOT IN (N'Approved', N'Rejected', N'Overridden')
            OR ReviewedByUserId IS NOT NULL
        );

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_ReviewedAtWhenReviewed')
   AND OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.FindingRecords
        WHERE HumanReviewStatus IN (N'Approved', N'Rejected', N'Overridden')
          AND ReviewedAtUtc IS NULL)
    ALTER TABLE dbo.FindingRecords ADD CONSTRAINT CK_FindingRecords_ReviewedAtWhenReviewed
        CHECK (
            HumanReviewStatus NOT IN (N'Approved', N'Rejected', N'Overridden')
            OR ReviewedAtUtc IS NOT NULL
        );

GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingReviewEvents
    (
        EventId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FindingReviewEvents PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        FindingId NVARCHAR(200) NOT NULL,
        ReviewerUserId NVARCHAR(256) NOT NULL,
        Action NVARCHAR(50) NOT NULL,
        Notes NVARCHAR(MAX) NULL,
        OccurredAtUtc DATETIME2 NOT NULL,
        RunId UNIQUEIDENTIFIER NULL
    );
    CREATE NONCLUSTERED INDEX IX_FindingReviewEvents_Tenant_Finding
        ON dbo.FindingReviewEvents (TenantId, FindingId, OccurredAtUtc DESC);
END;

GO

/* Tenant+time range seeks for ListSinceUtcAsync (ROI basis breakdown, realized value, trailing 30-day metrics). */
IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1
                   FROM sys.indexes
                   WHERE name = N'IX_FindingReviewEvents_Tenant_OccurredAt'
                     AND object_id = OBJECT_ID(N'dbo.FindingReviewEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FindingReviewEvents_Tenant_OccurredAt
        ON dbo.FindingReviewEvents (TenantId, OccurredAtUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'Disposition') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD Disposition NVARCHAR(64) NULL;

GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'RevisitDueUtc') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD RevisitDueUtc DATETIME2 NULL;

GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'EvidenceRequestText') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD EvidenceRequestText NVARCHAR(MAX) NULL;

GO

IF OBJECT_ID(N'dbo.RiskExceptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RiskExceptions
    (
        RiskExceptionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RiskExceptions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        FindingId NVARCHAR(200) NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        ManifestId UNIQUEIDENTIFIER NULL,
        OwnerUserId NVARCHAR(256) NOT NULL,
        Rationale NVARCHAR(MAX) NOT NULL,
        EvidenceRef NVARCHAR(500) NULL,
        ExpiresAtUtc DATETIME2 NOT NULL,
        Status NVARCHAR(32) NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NOT NULL,
        RevokedAtUtc DATETIME2 NULL,
        RevokedByUserId NVARCHAR(256) NULL
    );

    CREATE NONCLUSTERED INDEX IX_RiskExceptions_Tenant_Finding
        ON dbo.RiskExceptions (TenantId, FindingId, Status);

    CREATE NONCLUSTERED INDEX IX_RiskExceptions_Tenant_Expires
        ON dbo.RiskExceptions (TenantId, ExpiresAtUtc, Status);
END;

GO

IF OBJECT_ID(N'dbo.ImportedArchitectureRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ImportedArchitectureRequests
    (
        ImportId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ImportedArchitectureRequests PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        SourceFileName NVARCHAR(400) NOT NULL,
        Format NVARCHAR(16) NOT NULL,
        Status NVARCHAR(32) NOT NULL CONSTRAINT DF_ImportedArchitectureRequests_Status_Master DEFAULT (N'Draft'),
        RequestJson NVARCHAR(MAX) NULL,
        CONSTRAINT CH_ImportedArchitectureRequests_Format CHECK (Format IN (N'toml', N'json'))
    );
    CREATE NONCLUSTERED INDEX IX_ImportedArchitectureRequests_Scope_Created
        ON dbo.ImportedArchitectureRequests (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.AzureExtractorPackages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureExtractorPackages
    (
        PackageId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureExtractorPackages PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        RunId                   UNIQUEIDENTIFIER NULL,
        CreatedUtc              DATETIME2        NOT NULL,
        SchemaVersion           INT              NOT NULL,
        ScriptVersion           NVARCHAR(64)      NULL,
        CollectionTimestampUtc  DATETIME2        NULL,
        SubscriptionId          NVARCHAR(128)      NULL,
        OriginalFileName        NVARCHAR(400)     NOT NULL,
        ManifestJson            NVARCHAR(MAX)     NOT NULL,
        PackageBytes            VARBINARY(MAX)    NOT NULL,
        CONSTRAINT FK_AzureExtractorPackages_Runs FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureExtractorPackages_Scope_Created
        ON dbo.AzureExtractorPackages (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_AzureExtractorPackages_RunId
        ON dbo.AzureExtractorPackages (RunId)
        WHERE RunId IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.CloudInventoryExtractorPackages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CloudInventoryExtractorPackages
    (
        PackageId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CloudInventoryExtractorPackages PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        RunId                   UNIQUEIDENTIFIER NULL,
        CreatedUtc              DATETIME2        NOT NULL,
        CloudProvider           INT              NOT NULL,
        SchemaVersion           INT              NOT NULL,
        ScriptVersion           NVARCHAR(64)      NULL,
        CollectionTimestampUtc  DATETIME2        NULL,
        ScopeId                 NVARCHAR(128)     NOT NULL,
        OriginalFileName        NVARCHAR(400)     NOT NULL,
        ManifestJson            NVARCHAR(MAX)     NOT NULL,
        PackageBytes            VARBINARY(MAX)    NOT NULL,
        CONSTRAINT FK_CloudInventoryExtractorPackages_Runs FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );

    CREATE NONCLUSTERED INDEX IX_CloudInventoryExtractorPackages_Scope_Provider_Created
        ON dbo.CloudInventoryExtractorPackages (TenantId, WorkspaceId, ProjectId, CloudProvider, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_CloudInventoryExtractorPackages_RunId
        ON dbo.CloudInventoryExtractorPackages (RunId)
        WHERE RunId IS NOT NULL;
END;

GO

IF OBJECT_ID('dbo.DecisioningTraces', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DecisioningTraces
    (
        DecisionTraceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        RuleSetId NVARCHAR(200) NOT NULL,
        RuleSetVersion NVARCHAR(50) NOT NULL,
        RuleSetHash NVARCHAR(128) NOT NULL,
        AppliedRuleIdsJson NVARCHAR(MAX) NOT NULL,
        AcceptedFindingIdsJson NVARCHAR(MAX) NOT NULL,
        RejectedFindingIdsJson NVARCHAR(MAX) NOT NULL,
        NotesJson NVARCHAR(MAX) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        INDEX IX_DecisioningTraces_RunId NONCLUSTERED (RunId)
    );
END;

GO

/* Brownfield: soft-archive on dbo.DecisioningTraces (DbUp 067 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DecisioningTraces', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD ArchivedUtc DATETIME2 NULL;

GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NULL
   AND OBJECT_ID(N'dbo.GoldenManifests') IS NULL
   AND OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifests
    (
        ManifestId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        ContextSnapshotId UNIQUEIDENTIFIER NOT NULL,
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL,
        FindingsSnapshotId UNIQUEIDENTIFIER NOT NULL,
        DecisionTraceId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ManifestHash NVARCHAR(128) NOT NULL,
        RuleSetId NVARCHAR(200) NOT NULL,
        RuleSetVersion NVARCHAR(50) NOT NULL,
        RuleSetHash NVARCHAR(128) NOT NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL,
        RequirementsJson NVARCHAR(MAX) NOT NULL,
        TopologyJson NVARCHAR(MAX) NOT NULL,
        SecurityJson NVARCHAR(MAX) NOT NULL,
        ComplianceJson NVARCHAR(MAX) NOT NULL,
        CostJson NVARCHAR(MAX) NOT NULL,
        ConstraintsJson NVARCHAR(MAX) NOT NULL,
        UnresolvedIssuesJson NVARCHAR(MAX) NOT NULL,
        DecisionsJson NVARCHAR(MAX) NOT NULL,
        AssumptionsJson NVARCHAR(MAX) NOT NULL,
        WarningsJson NVARCHAR(MAX) NOT NULL,
        ProvenanceJson NVARCHAR(MAX) NOT NULL,
        ManifestPayloadBlobUri NVARCHAR(2000) NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RowVersionStamp ROWVERSION,
        INDEX IX_GoldenManifests_RunId NONCLUSTERED (RunId)
    );
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.GoldenManifests ADD RowVersionStamp ROWVERSION;

GO

/* Brownfield: soft-archive on dbo.GoldenManifests (DbUp 066 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.GoldenManifests ADD ArchivedUtc DATETIME2 NULL;

GO

/* Brownfield: golden manifest lifecycle column (DbUp 127 parity). */
IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'LifecycleStatus') IS NULL
    ALTER TABLE dbo.GoldenManifests ADD LifecycleStatus NVARCHAR(32) NOT NULL
        CONSTRAINT DF_GoldenManifests_LifecycleStatus_Master DEFAULT (N'Active');

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_GoldenManifests_LifecycleStatus')
   AND OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
    ALTER TABLE dbo.GoldenManifests ADD CONSTRAINT CK_GoldenManifests_LifecycleStatus
        CHECK (LifecycleStatus IN (N'Active', N'Superseded', N'Archived'));

GO

/* Brownfield: typed contract manifest version for version lookups (DbUp 302 + 306 parity).
   Resolves the physical table because migration 295 left dbo.GoldenManifests as a synonym, and both
   OBJECT_ID(..., N'U') and COL_LENGTH return NULL when handed a synonym name. */
DECLARE @manifestVersionTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL THEN N'dbo.SignedReviewRecords'
        WHEN OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL THEN N'dbo.GoldenManifests'
    END;

IF @manifestVersionTable IS NOT NULL
   AND COL_LENGTH(@manifestVersionTable, N'ContractManifestVersion') IS NULL
BEGIN
    DECLARE @addManifestVersionSql NVARCHAR(MAX) =
        N'ALTER TABLE ' + @manifestVersionTable + N' ADD ContractManifestVersion NVARCHAR(128) NULL;';

    EXEC sp_executesql @addManifestVersionSql;
END

GO

-- Phase-1 relational slices for GoldenManifest (dual-write; other sections remain JSON on dbo.GoldenManifests).
IF OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestAssumptions
    (
        ManifestId      UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        AssumptionText  NVARCHAR(MAX) NOT NULL,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId     UNIQUEIDENTIFIER NOT NULL,
        ProjectId       UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_GoldenManifestAssumptions PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestAssumptions_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestAssumptions_ManifestId
        ON dbo.GoldenManifestAssumptions (ManifestId);
END;

GO

/* Brownfield: RLS scope denormalization (DbUp 046 parity) on dbo.GoldenManifestAssumptions */
IF OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.GoldenManifestAssumptions', N'TenantId') IS NULL
        ALTER TABLE dbo.GoldenManifestAssumptions ADD TenantId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.GoldenManifestAssumptions', N'WorkspaceId') IS NULL
        ALTER TABLE dbo.GoldenManifestAssumptions ADD WorkspaceId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH(N'dbo.GoldenManifestAssumptions', N'ProjectId') IS NULL
        ALTER TABLE dbo.GoldenManifestAssumptions ADD ProjectId UNIQUEIDENTIFIER NULL;
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifestWarnings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestWarnings
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        WarningText  NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_GoldenManifestWarnings PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestWarnings_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestWarnings_ManifestId
        ON dbo.GoldenManifestWarnings (ManifestId);
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestDecisions
    (
        ManifestId       UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder        INT NOT NULL,
        DecisionId       NVARCHAR(200) NOT NULL,
        Category         NVARCHAR(500) NOT NULL,
        Title            NVARCHAR(500) NOT NULL,
        SelectedOption   NVARCHAR(2000) NOT NULL,
        Rationale        NVARCHAR(MAX) NOT NULL,
        RawDecisionJson  NVARCHAR(MAX) NULL,
        CONSTRAINT PK_GoldenManifestDecisions PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT UQ_GoldenManifestDecisions_DecisionId UNIQUE (ManifestId, DecisionId),
        CONSTRAINT FK_GoldenManifestDecisions_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestDecisions_ManifestId
        ON dbo.GoldenManifestDecisions (ManifestId);
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifestDecisions', N'Confidence') IS NULL
    ALTER TABLE dbo.GoldenManifestDecisions ADD Confidence FLOAT NULL;

GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifestDecisions', N'ConfidenceSource') IS NULL
    ALTER TABLE dbo.GoldenManifestDecisions ADD ConfidenceSource NVARCHAR(32) NULL;

GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionEvidenceLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestDecisionEvidenceLinks
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        DecisionId   NVARCHAR(200) NOT NULL,
        SortOrder    INT NOT NULL,
        FindingId    NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_GoldenManifestDecisionEvidenceLinks PRIMARY KEY (ManifestId, DecisionId, SortOrder),
        CONSTRAINT FK_GoldenManifestDecisionEvidenceLinks_Decisions FOREIGN KEY (ManifestId, DecisionId)
            REFERENCES dbo.GoldenManifestDecisions (ManifestId, DecisionId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestDecisionEvidenceLinks_Manifest
        ON dbo.GoldenManifestDecisionEvidenceLinks (ManifestId);
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionNodeLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestDecisionNodeLinks
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        DecisionId   NVARCHAR(200) NOT NULL,
        SortOrder    INT NOT NULL,
        NodeId       NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_GoldenManifestDecisionNodeLinks PRIMARY KEY (ManifestId, DecisionId, SortOrder),
        CONSTRAINT FK_GoldenManifestDecisionNodeLinks_Decisions FOREIGN KEY (ManifestId, DecisionId)
            REFERENCES dbo.GoldenManifestDecisions (ManifestId, DecisionId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestDecisionNodeLinks_Manifest
        ON dbo.GoldenManifestDecisionNodeLinks (ManifestId);
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceFindings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestProvenanceSourceFindings
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        FindingId    NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_GoldenManifestProvenanceSourceFindings PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestProvenanceSourceFindings_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestProvenanceSourceFindings_Manifest
        ON dbo.GoldenManifestProvenanceSourceFindings (ManifestId);
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestProvenanceSourceGraphNodes
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        NodeId       NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_GoldenManifestProvenanceSourceGraphNodes PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestProvenanceSourceGraphNodes_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestProvenanceSourceGraphNodes_Manifest
        ON dbo.GoldenManifestProvenanceSourceGraphNodes (ManifestId);
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceAppliedRules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestProvenanceAppliedRules
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        RuleId       NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_GoldenManifestProvenanceAppliedRules PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestProvenanceAppliedRules_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestProvenanceAppliedRules_Manifest
        ON dbo.GoldenManifestProvenanceAppliedRules (ManifestId);
END;

GO

IF OBJECT_ID('dbo.ArtifactBundles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArtifactBundles
    (
        BundleId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        ManifestId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ArtifactsJson NVARCHAR(MAX) NULL,
        TraceJson NVARCHAR(MAX) NULL,
        BundlePayloadBlobUri NVARCHAR(2000) NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        INDEX IX_ArtifactBundles_RunId NONCLUSTERED (RunId),
        INDEX IX_ArtifactBundles_ManifestId NONCLUSTERED (ManifestId)
    );
END;

GO

/* ArtifactBundles legacy JSON columns nullable (see Migrations/043_ArtifactBundles_LegacyJsonNullable.sql). */
IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.schema_id = SCHEMA_ID(N'dbo')
          AND t.name = N'ArtifactBundles'
          AND c.name = N'ArtifactsJson'
          AND c.is_nullable = 0)
        ALTER TABLE dbo.ArtifactBundles ALTER COLUMN ArtifactsJson NVARCHAR(MAX) NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.schema_id = SCHEMA_ID(N'dbo')
          AND t.name = N'ArtifactBundles'
          AND c.name = N'TraceJson'
          AND c.is_nullable = 0)
        ALTER TABLE dbo.ArtifactBundles ALTER COLUMN TraceJson NVARCHAR(MAX) NULL;
END;

GO

/* Brownfield: soft-archive on dbo.ArtifactBundles (DbUp 073 parity; cascaded when dbo.Runs bulk-archive). */
IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArtifactBundles', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.ArtifactBundles ADD ArchivedUtc DATETIME2 NULL;

GO

/* Brownfield: artifact bundle synthesis status (DbUp 127 parity). */
IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArtifactBundles', N'Status') IS NULL
    ALTER TABLE dbo.ArtifactBundles ADD Status NVARCHAR(32) NOT NULL
        CONSTRAINT DF_ArtifactBundles_Status_Master DEFAULT (N'Available');

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ArtifactBundles_Status')
   AND OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
    ALTER TABLE dbo.ArtifactBundles ADD CONSTRAINT CK_ArtifactBundles_Status
        CHECK (Status IN (N'Pending', N'Available', N'Partial', N'Failed', N'Archived'));

GO

-- Relational artifact bundle slices (dual-write with ArtifactsJson / TraceJson on dbo.ArtifactBundles).
IF OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArtifactBundleArtifacts
    (
        BundleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        ArtifactId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        ManifestId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ArtifactType NVARCHAR(500) NOT NULL,
        Name NVARCHAR(2000) NOT NULL,
        Format NVARCHAR(200) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        ContentHash NVARCHAR(128) NOT NULL,
        ContentBlobUri NVARCHAR(2000) NULL,
        CONSTRAINT PK_ArtifactBundleArtifacts PRIMARY KEY (BundleId, SortOrder),
        CONSTRAINT UQ_ArtifactBundleArtifacts_ArtifactId UNIQUE (BundleId, ArtifactId),
        CONSTRAINT FK_ArtifactBundleArtifacts_Bundles FOREIGN KEY (BundleId)
            REFERENCES dbo.ArtifactBundles (BundleId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ArtifactBundleArtifacts_BundleId
        ON dbo.ArtifactBundleArtifacts (BundleId);
END;

GO

IF OBJECT_ID(N'dbo.ArtifactBundleArtifactMetadata', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArtifactBundleArtifactMetadata
    (
        BundleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        ArtifactSortOrder INT NOT NULL,
        MetaSortOrder INT NOT NULL,
        MetaKey NVARCHAR(500) NOT NULL,
        MetaValue NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_ArtifactBundleArtifactMetadata PRIMARY KEY (BundleId, ArtifactSortOrder, MetaSortOrder),
        CONSTRAINT FK_ArtifactBundleArtifactMetadata_Artifacts FOREIGN KEY (BundleId, ArtifactSortOrder)
            REFERENCES dbo.ArtifactBundleArtifacts (BundleId, SortOrder) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ArtifactBundleArtifactMetadata_Bundle
        ON dbo.ArtifactBundleArtifactMetadata (BundleId);
END;

GO

IF OBJECT_ID(N'dbo.ArtifactBundleArtifactDecisionLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArtifactBundleArtifactDecisionLinks
    (
        BundleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        ArtifactSortOrder INT NOT NULL,
        LinkSortOrder INT NOT NULL,
        DecisionId NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_ArtifactBundleArtifactDecisionLinks PRIMARY KEY (BundleId, ArtifactSortOrder, LinkSortOrder),
        CONSTRAINT FK_ArtifactBundleArtifactDecisionLinks_Artifacts FOREIGN KEY (BundleId, ArtifactSortOrder)
            REFERENCES dbo.ArtifactBundleArtifacts (BundleId, SortOrder) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ArtifactBundleArtifactDecisionLinks_Bundle
        ON dbo.ArtifactBundleArtifactDecisionLinks (BundleId);
END;

GO

IF OBJECT_ID(N'dbo.ArtifactBundleTraceGenerators', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArtifactBundleTraceGenerators
    (
        BundleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        GeneratorName NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_ArtifactBundleTraceGenerators PRIMARY KEY (BundleId, SortOrder),
        CONSTRAINT FK_ArtifactBundleTraceGenerators_Bundles FOREIGN KEY (BundleId)
            REFERENCES dbo.ArtifactBundles (BundleId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ArtifactBundleTraceGenerators_BundleId
        ON dbo.ArtifactBundleTraceGenerators (BundleId);
END;

GO

IF OBJECT_ID(N'dbo.ArtifactBundleTraceDecisionLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArtifactBundleTraceDecisionLinks
    (
        BundleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        DecisionId NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_ArtifactBundleTraceDecisionLinks PRIMARY KEY (BundleId, SortOrder),
        CONSTRAINT FK_ArtifactBundleTraceDecisionLinks_Bundles FOREIGN KEY (BundleId)
            REFERENCES dbo.ArtifactBundles (BundleId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ArtifactBundleTraceDecisionLinks_BundleId
        ON dbo.ArtifactBundleTraceDecisionLinks (BundleId);
END;

GO

IF OBJECT_ID(N'dbo.ArtifactBundleTraceNotes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArtifactBundleTraceNotes
    (
        BundleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SortOrder INT NOT NULL,
        NoteText NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_ArtifactBundleTraceNotes PRIMARY KEY (BundleId, SortOrder),
        CONSTRAINT FK_ArtifactBundleTraceNotes_Bundles FOREIGN KEY (BundleId)
            REFERENCES dbo.ArtifactBundles (BundleId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ArtifactBundleTraceNotes_BundleId
        ON dbo.ArtifactBundleTraceNotes (BundleId);
END;

GO

/* -- Remove placeholder scope defaults from runtime-authoritative tables ----
   Inserts must supply TenantId, WorkspaceId, ProjectId (scope), and Runs.ScopeProjectId.
   Batches below drop legacy named defaults on existing databases (greenfield CREATE above has none).
*/
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.Runs') AND name = N'DF_Runs_TenantId')
        ALTER TABLE dbo.Runs DROP CONSTRAINT DF_Runs_TenantId;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.Runs') AND name = N'DF_Runs_WorkspaceId')
        ALTER TABLE dbo.Runs DROP CONSTRAINT DF_Runs_WorkspaceId;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.Runs') AND name = N'DF_Runs_ScopeProjectId')
        ALTER TABLE dbo.Runs DROP CONSTRAINT DF_Runs_ScopeProjectId;
END;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.DecisioningTraces') AND name = N'DF_DecisioningTraces_TenantId_Create')
        ALTER TABLE dbo.DecisioningTraces DROP CONSTRAINT DF_DecisioningTraces_TenantId_Create;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.DecisioningTraces') AND name = N'DF_DecisioningTraces_WorkspaceId_Create')
        ALTER TABLE dbo.DecisioningTraces DROP CONSTRAINT DF_DecisioningTraces_WorkspaceId_Create;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.DecisioningTraces') AND name = N'DF_DecisioningTraces_ProjectId_Create')
        ALTER TABLE dbo.DecisioningTraces DROP CONSTRAINT DF_DecisioningTraces_ProjectId_Create;
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.GoldenManifests') AND name = N'DF_GoldenManifests_TenantId')
        ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT DF_GoldenManifests_TenantId;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.GoldenManifests') AND name = N'DF_GoldenManifests_WorkspaceId')
        ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT DF_GoldenManifests_WorkspaceId;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.GoldenManifests') AND name = N'DF_GoldenManifests_ProjectId')
        ALTER TABLE dbo.GoldenManifests DROP CONSTRAINT DF_GoldenManifests_ProjectId;
END;

GO

IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.ArtifactBundles') AND name = N'DF_ArtifactBundles_TenantId')
        ALTER TABLE dbo.ArtifactBundles DROP CONSTRAINT DF_ArtifactBundles_TenantId;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.ArtifactBundles') AND name = N'DF_ArtifactBundles_WorkspaceId')
        ALTER TABLE dbo.ArtifactBundles DROP CONSTRAINT DF_ArtifactBundles_WorkspaceId;

    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.ArtifactBundles') AND name = N'DF_ArtifactBundles_ProjectId')
        ALTER TABLE dbo.ArtifactBundles DROP CONSTRAINT DF_ArtifactBundles_ProjectId;
END;

GO

/* -- Critical FK hardening for canonical runtime chain ----
   Authority/decisioning tables (dbo.Runs … dbo.ArtifactBundles): enforces insert order
   and referential integrity for the runtime chain. ON DELETE omitted => NO ACTION (default).
   GoldenManifests.DecisionTraceId references dbo.DecisioningTraces (PK column DecisionTraceId).

   Greenfield parity: the IF NOT EXISTS + ALTER TABLE … WITH NOCHECK batches below align with
   DbUp 147_AuthorityChain_RunForeignKeys_NotTrustedWhenMissing.sql (same constraint names).

   Constraints are added with WITH NOCHECK so brownfield databases that already contain legacy orphan
   rows can still install DDL; **new** inserts/updates must satisfy dbo.Runs and the snapshot chain.
   DbUp 134 adds the same keys when the catalog is clean (trusted). DbUp 147 adds any still-missing
   names with NOCHECK after 134 (orphan-safe brownfield installs).
*/
IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ContextSnapshots_Runs_RunId')
        ALTER TABLE dbo.ContextSnapshots WITH NOCHECK ADD CONSTRAINT FK_ContextSnapshots_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId')
        ALTER TABLE dbo.GraphSnapshots WITH NOCHECK ADD CONSTRAINT FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId
            FOREIGN KEY (ContextSnapshotId) REFERENCES dbo.ContextSnapshots (SnapshotId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GraphSnapshots_Runs_RunId')
        ALTER TABLE dbo.GraphSnapshots WITH NOCHECK ADD CONSTRAINT FK_GraphSnapshots_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_Runs_RunId')
        ALTER TABLE dbo.FindingsSnapshots WITH NOCHECK ADD CONSTRAINT FK_FindingsSnapshots_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId')
        ALTER TABLE dbo.FindingsSnapshots WITH NOCHECK ADD CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId
            FOREIGN KEY (ContextSnapshotId) REFERENCES dbo.ContextSnapshots (SnapshotId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId')
        ALTER TABLE dbo.FindingsSnapshots WITH NOCHECK ADD CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId
            FOREIGN KEY (GraphSnapshotId) REFERENCES dbo.GraphSnapshots (GraphSnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisioningTraces_Runs_RunId')
        ALTER TABLE dbo.DecisioningTraces WITH NOCHECK ADD CONSTRAINT FK_DecisioningTraces_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentTasks_Runs_RunId')
        ALTER TABLE dbo.AgentTasks WITH NOCHECK ADD CONSTRAINT FK_AgentTasks_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentResults_Runs_RunId')
        ALTER TABLE dbo.AgentResults WITH NOCHECK ADD CONSTRAINT FK_AgentResults_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvidencePackages_Runs_RunId')
        ALTER TABLE dbo.AgentEvidencePackages WITH NOCHECK ADD CONSTRAINT FK_AgentEvidencePackages_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentExecutionTraces_Runs_RunId')
        ALTER TABLE dbo.AgentExecutionTraces WITH NOCHECK ADD CONSTRAINT FK_AgentExecutionTraces_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_Runs_RunId')
        ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_ContextSnapshots_ContextSnapshotId')
        ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_ContextSnapshots_ContextSnapshotId
            FOREIGN KEY (ContextSnapshotId) REFERENCES dbo.ContextSnapshots (SnapshotId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_GraphSnapshots_GraphSnapshotId')
        ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_GraphSnapshots_GraphSnapshotId
            FOREIGN KEY (GraphSnapshotId) REFERENCES dbo.GraphSnapshots (GraphSnapshotId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId')
        ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId
            FOREIGN KEY (FindingsSnapshotId) REFERENCES dbo.FindingsSnapshots (FindingsSnapshotId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_DecisioningTraces_DecisionTraceId')
        ALTER TABLE dbo.GoldenManifests WITH NOCHECK ADD CONSTRAINT FK_GoldenManifests_DecisioningTraces_DecisionTraceId
            FOREIGN KEY (DecisionTraceId) REFERENCES dbo.DecisioningTraces (DecisionTraceId);
END;

GO

IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_Runs_RunId')
        ALTER TABLE dbo.ArtifactBundles WITH NOCHECK ADD CONSTRAINT FK_ArtifactBundles_Runs_RunId
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArtifactBundles_GoldenManifests_ManifestId')
        ALTER TABLE dbo.ArtifactBundles WITH NOCHECK ADD CONSTRAINT FK_ArtifactBundles_GoldenManifests_ManifestId
            FOREIGN KEY (ManifestId) REFERENCES dbo.GoldenManifests (ManifestId);
END;

GO

/* -- Critical uniqueness hardening for canonical runtime chain ----
   One active authority GoldenManifest per Run (filtered unique index).
   GraphSnapshots: multiple rows per ContextSnapshotId are intentional — pipeline retries and
   GraphSnapshotReuseEvaluator pick the latest by CreatedUtc (see InMemoryGraphSnapshotRepositoryTests).
   ArtifactBundles: multiple rows per ManifestId are intentional — synthesis retries pick TOP 1 by CreatedUtc.
*/
IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_GoldenManifests_RunId_Active'
          AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
        CREATE UNIQUE INDEX UX_GoldenManifests_RunId_Active
            ON dbo.GoldenManifests (RunId)
            WHERE ArchivedUtc IS NULL;
END;

GO

/* TB-201: canonical AgentResult per (RunId, TaskId). */
IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    ;WITH ranked AS (
        SELECT ResultId,
               ROW_NUMBER() OVER (
                   PARTITION BY RunId, TaskId
                   ORDER BY CreatedUtc DESC, ResultId DESC) AS rn
        FROM dbo.AgentResults
    )
    DELETE t
    FROM dbo.AgentResults AS t
    INNER JOIN ranked AS r ON r.ResultId = t.ResultId
    WHERE r.rn > 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentResults_RunId_TaskId'
          AND object_id = OBJECT_ID(N'dbo.AgentResults'))
        CREATE UNIQUE INDEX UX_AgentResults_RunId_TaskId
            ON dbo.AgentResults (RunId, TaskId);
END;

GO

/* TB-044: canonical AgentExecutionTrace per (RunId, TaskId, AgentType). */
IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    ;WITH ranked AS (
        SELECT TraceId,
               ROW_NUMBER() OVER (
                   PARTITION BY RunId, TaskId, AgentType
                   ORDER BY CreatedUtc DESC, TraceId DESC) AS rn
        FROM dbo.AgentExecutionTraces
    )
    DELETE t
    FROM dbo.AgentExecutionTraces AS t
    INNER JOIN ranked AS r ON r.TraceId = t.TraceId
    WHERE r.rn > 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_AgentExecutionTraces_RunId_TaskId_AgentType'
          AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
        CREATE UNIQUE INDEX UX_AgentExecutionTraces_RunId_TaskId_AgentType
            ON dbo.AgentExecutionTraces (RunId, TaskId, AgentType);
END;

GO

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_FindingsSnapshots_GraphSnapshotId'
          AND object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
        CREATE UNIQUE INDEX UX_FindingsSnapshots_GraphSnapshotId ON dbo.FindingsSnapshots (GraphSnapshotId);
END;

GO

/* Append-only audit stream (no UPDATE/DELETE from application code). */
IF OBJECT_ID('dbo.AuditEvents', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvents
    (
        EventId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        OccurredUtc DATETIME2 NOT NULL,
        EventType NVARCHAR(100) NOT NULL,
        ActorUserId NVARCHAR(200) NOT NULL,
        ActorUserName NVARCHAR(200) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        ManifestId UNIQUEIDENTIFIER NULL,
        ArtifactId UNIQUEIDENTIFIER NULL,
        DataJson NVARCHAR(MAX) NOT NULL,
        CorrelationId NVARCHAR(200) NULL,
        INDEX IX_AuditEvents_Scope_OccurredUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, OccurredUtc DESC)
    );
END;

GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_CorrelationId'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_CorrelationId
        ON dbo.AuditEvents (CorrelationId)
        WHERE CorrelationId IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_RunId_OccurredUtc'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_RunId_OccurredUtc
        ON dbo.AuditEvents (RunId, OccurredUtc DESC)
        WHERE RunId IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_OccurredUtc_EventId'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_OccurredUtc_EventId
        ON dbo.AuditEvents (OccurredUtc DESC, EventId DESC)
        INCLUDE (TenantId, WorkspaceId, ProjectId, EventType, ActorUserId, RunId);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_Scope_EventType_OccurredUtc'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_Scope_EventType_OccurredUtc
        ON dbo.AuditEvents (TenantId, WorkspaceId, ProjectId, EventType, OccurredUtc DESC)
        INCLUDE (EventId, ActorUserId, RunId);
END;

GO

IF OBJECT_ID('dbo.ProvenanceSnapshots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProvenanceSnapshots
    (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        GraphJson NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        SourceRevisionHash NVARCHAR(64) NULL,
        INDEX IX_ProvenanceSnapshots_Scope_Run NONCLUSTERED (TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc DESC)
    );
END;

GO

IF COL_LENGTH('dbo.ProvenanceSnapshots', 'SourceRevisionHash') IS NULL
BEGIN
    ALTER TABLE dbo.ProvenanceSnapshots ADD SourceRevisionHash NVARCHAR(64) NULL;
END;

GO

IF OBJECT_ID('dbo.ConversationThreads', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConversationThreads
    (
        ThreadId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        BaseRunId UNIQUEIDENTIFIER NULL,
        TargetRunId UNIQUEIDENTIFIER NULL,
        Title NVARCHAR(300) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        LastUpdatedUtc DATETIME2 NOT NULL,
        ArchivedUtc DATETIME2 NULL,
        INDEX IX_ConversationThreads_Scope NONCLUSTERED (TenantId, WorkspaceId, ProjectId, LastUpdatedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.ConversationMessages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConversationMessages
    (
        MessageId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ThreadId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        Role NVARCHAR(50) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL,
        INDEX IX_ConversationMessages_ThreadId_CreatedUtc NONCLUSTERED (ThreadId, CreatedUtc ASC)
    );
END;

GO

IF OBJECT_ID('dbo.RecommendationRecords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RecommendationRecords
    (
        RecommendationId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,

        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,

        RunId UNIQUEIDENTIFIER NOT NULL,
        ComparedToRunId UNIQUEIDENTIFIER NULL,

        Title NVARCHAR(500) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        Rationale NVARCHAR(MAX) NOT NULL,
        SuggestedAction NVARCHAR(MAX) NOT NULL,
        Urgency NVARCHAR(50) NOT NULL,
        ExpectedImpact NVARCHAR(MAX) NOT NULL,
        PriorityScore INT NOT NULL,

        Status NVARCHAR(50) NOT NULL,

        CreatedUtc DATETIME2 NOT NULL,
        LastUpdatedUtc DATETIME2 NOT NULL,

        ReviewedByUserId NVARCHAR(200) NULL,
        ReviewedByUserName NVARCHAR(200) NULL,
        ReviewComment NVARCHAR(MAX) NULL,
        ResolutionRationale NVARCHAR(MAX) NULL,

        SupportingFindingIdsJson NVARCHAR(MAX) NOT NULL,
        SupportingDecisionIdsJson NVARCHAR(MAX) NOT NULL,
        SupportingArtifactIdsJson NVARCHAR(MAX) NOT NULL,
        RowVersionStamp ROWVERSION,
        INDEX IX_RecommendationRecords_Scope_Run NONCLUSTERED (TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc DESC),
        INDEX IX_RecommendationRecords_Scope_Status NONCLUSTERED (TenantId, WorkspaceId, ProjectId, Status, LastUpdatedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.RecommendationLearningProfiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RecommendationLearningProfiles
    (
        ProfileId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        GeneratedUtc DATETIME2 NOT NULL,
        ProfileJson NVARCHAR(MAX) NOT NULL,
        INDEX IX_RecommendationLearningProfiles_Scope_GeneratedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, GeneratedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.AdvisoryScanSchedules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdvisoryScanSchedules
    (
        ScheduleId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunProjectSlug NVARCHAR(200) NOT NULL CONSTRAINT DF_AdvisoryScanSchedules_RunProjectSlug DEFAULT ('default'),
        Name NVARCHAR(300) NOT NULL,
        CronExpression NVARCHAR(100) NOT NULL,
        IsEnabled BIT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        LastRunUtc DATETIME2 NULL,
        NextRunUtc DATETIME2 NULL,
        INDEX IX_AdvisoryScanSchedules_Scope_Enabled_NextRun NONCLUSTERED (TenantId, WorkspaceId, ProjectId, IsEnabled, NextRunUtc)
    );
END;

GO

IF OBJECT_ID('dbo.AdvisoryScanExecutions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdvisoryScanExecutions
    (
        ExecutionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ScheduleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        StartedUtc DATETIME2 NOT NULL,
        CompletedUtc DATETIME2 NULL,
        Status NVARCHAR(50) NOT NULL,
        ResultJson NVARCHAR(MAX) NOT NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        INDEX IX_AdvisoryScanExecutions_Schedule_StartedUtc NONCLUSTERED (ScheduleId, StartedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.ArchitectureDigests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureDigests
    (
        DigestId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        ComparedToRunId UNIQUEIDENTIFIER NULL,
        GeneratedUtc DATETIME2 NOT NULL,
        Title NVARCHAR(300) NOT NULL,
        Summary NVARCHAR(MAX) NOT NULL,
        ContentMarkdown NVARCHAR(MAX) NOT NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL,
        ArchivedUtc DATETIME2 NULL,
        INDEX IX_ArchitectureDigests_Scope_GeneratedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, GeneratedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.DigestSubscriptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DigestSubscriptions
    (
        SubscriptionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(300) NOT NULL,
        ChannelType NVARCHAR(100) NOT NULL,
        Destination NVARCHAR(1000) NOT NULL,
        IsEnabled BIT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        LastDeliveredUtc DATETIME2 NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL,
        INDEX IX_DigestSubscriptions_Scope_Enabled NONCLUSTERED (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.DigestDeliveryAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DigestDeliveryAttempts
    (
        AttemptId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        DigestId UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        AttemptedUtc DATETIME2 NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        ChannelType NVARCHAR(100) NOT NULL,
        Destination NVARCHAR(1000) NOT NULL,
        INDEX IX_DigestDeliveryAttempts_DigestId_AttemptedUtc NONCLUSTERED (DigestId, AttemptedUtc DESC),
        INDEX IX_DigestDeliveryAttempts_SubscriptionId_AttemptedUtc NONCLUSTERED (SubscriptionId, AttemptedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.AlertRules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AlertRules
    (
        RuleId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AlertRules PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(300) NOT NULL,
        RuleType NVARCHAR(100) NOT NULL,
        Severity NVARCHAR(50) NOT NULL,
        ThresholdValue DECIMAL(18, 4) NOT NULL,
        IsEnabled BIT NOT NULL,
        TargetChannelType NVARCHAR(100) NOT NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        INDEX IX_AlertRules_Scope_Enabled NONCLUSTERED (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.AlertRecords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AlertRecords
    (
        AlertId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AlertRecords PRIMARY KEY,
        RuleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        ComparedToRunId UNIQUEIDENTIFIER NULL,
        RecommendationId UNIQUEIDENTIFIER NULL,
        Title NVARCHAR(500) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        Severity NVARCHAR(50) NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        TriggerValue NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        LastUpdatedUtc DATETIME2 NULL,
        AcknowledgedByUserId NVARCHAR(200) NULL,
        AcknowledgedByUserName NVARCHAR(200) NULL,
        ResolutionComment NVARCHAR(MAX) NULL,
        DeduplicationKey NVARCHAR(500) NOT NULL,
        RowVersionStamp ROWVERSION,
        INDEX IX_AlertRecords_Scope_Status_CreatedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, Status, CreatedUtc DESC),
        INDEX IX_AlertRecords_DeduplicationKey NONCLUSTERED (DeduplicationKey)
    );
END;

GO

IF OBJECT_ID('dbo.AlertRoutingSubscriptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AlertRoutingSubscriptions
    (
        RoutingSubscriptionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AlertRoutingSubscriptions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(300) NOT NULL,
        ChannelType NVARCHAR(100) NOT NULL,
        Destination NVARCHAR(1000) NOT NULL,
        MinimumSeverity NVARCHAR(50) NOT NULL,
        IsEnabled BIT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        LastDeliveredUtc DATETIME2 NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL,
        INDEX IX_AlertRoutingSubscriptions_Scope_Enabled NONCLUSTERED (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.AlertDeliveryAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AlertDeliveryAttempts
    (
        AlertDeliveryAttemptId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AlertDeliveryAttempts PRIMARY KEY,
        AlertId UNIQUEIDENTIFIER NOT NULL,
        RoutingSubscriptionId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        AttemptedUtc DATETIME2 NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        ChannelType NVARCHAR(100) NOT NULL,
        Destination NVARCHAR(1000) NOT NULL,
        RetryCount INT NOT NULL,
        INDEX IX_AlertDeliveryAttempts_AlertId_AttemptedUtc NONCLUSTERED (AlertId, AttemptedUtc DESC),
        INDEX IX_AlertDeliveryAttempts_RoutingSubscriptionId_AttemptedUtc NONCLUSTERED (RoutingSubscriptionId, AttemptedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.CompositeAlertRules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CompositeAlertRules
    (
        CompositeRuleId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CompositeAlertRules PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(300) NOT NULL,
        Severity NVARCHAR(50) NOT NULL,
        [Operator] NVARCHAR(20) NOT NULL,
        IsEnabled BIT NOT NULL,
        SuppressionWindowMinutes INT NOT NULL,
        CooldownMinutes INT NOT NULL,
        ReopenDeltaThreshold DECIMAL(18, 4) NOT NULL,
        DedupeScope NVARCHAR(100) NOT NULL,
        TargetChannelType NVARCHAR(100) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        INDEX IX_CompositeAlertRules_Scope_Enabled NONCLUSTERED (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.CompositeAlertRuleConditions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CompositeAlertRuleConditions
    (
        ConditionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CompositeAlertRuleConditions PRIMARY KEY,
        CompositeRuleId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        MetricType NVARCHAR(100) NOT NULL,
        [Operator] NVARCHAR(50) NOT NULL,
        ThresholdValue DECIMAL(18, 4) NOT NULL,
        INDEX IX_CompositeAlertRuleConditions_CompositeRuleId NONCLUSTERED (CompositeRuleId)
    );
END;

GO

IF OBJECT_ID('dbo.PolicyPacks', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPacks
    (
        PolicyPackId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PolicyPacks PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(300) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        PackType NVARCHAR(50) NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ActivatedUtc DATETIME2 NULL,
        CurrentVersion NVARCHAR(50) NOT NULL,
        INDEX IX_PolicyPacks_Scope_Status NONCLUSTERED (TenantId, WorkspaceId, ProjectId, Status, CreatedUtc DESC)
    );
END;

GO

IF OBJECT_ID('dbo.PolicyPackVersions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPackVersions
    (
        PolicyPackVersionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PolicyPackVersions PRIMARY KEY,
        PolicyPackId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        [Version] NVARCHAR(50) NOT NULL,
        ContentJson NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        IsPublished BIT NOT NULL,
        INDEX UQ_PolicyPackVersions_PolicyPackId_Version UNIQUE NONCLUSTERED (PolicyPackId, [Version])
    );
END;

GO

IF OBJECT_ID('dbo.PolicyPackAssignments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPackAssignments
    (
        AssignmentId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PolicyPackAssignments PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        PolicyPackId UNIQUEIDENTIFIER NOT NULL,
        PolicyPackVersion NVARCHAR(50) NOT NULL,
        IsEnabled BIT NOT NULL,
        ScopeLevel NVARCHAR(50) NOT NULL CONSTRAINT DF_PolicyPackAssignments_ScopeLevel_Create DEFAULT (N'Project'),
        IsPinned BIT NOT NULL CONSTRAINT DF_PolicyPackAssignments_IsPinned_Create DEFAULT (0),
        AssignedUtc DATETIME2 NOT NULL,
        ArchivedUtc DATETIME2 NULL,
        RowVersionStamp ROWVERSION,
        INDEX IX_PolicyPackAssignments_Scope_Enabled NONCLUSTERED (TenantId, WorkspaceId, ProjectId, IsEnabled, AssignedUtc DESC),
        INDEX IX_PolicyPackAssignments_ScopeLevel_AssignedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, ScopeLevel, AssignedUtc DESC)
    );
END;

GO

IF OBJECT_ID(N'dbo.PolicyPackChangeLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPackChangeLog
    (
        ChangeLogId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_PolicyPackChangeLog_ChangeLogId DEFAULT NEWSEQUENTIALID(),
        PolicyPackId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ChangeType NVARCHAR(64) NOT NULL,
        ChangedBy NVARCHAR(256) NOT NULL,
        ChangedUtc DATETIME2(7) NOT NULL
            CONSTRAINT DF_PolicyPackChangeLog_ChangedUtc DEFAULT SYSUTCDATETIME(),
        PreviousValue NVARCHAR(MAX) NULL,
        NewValue NVARCHAR(MAX) NULL,
        SummaryText NVARCHAR(512) NULL,
        CONSTRAINT PK_PolicyPackChangeLog
            PRIMARY KEY CLUSTERED (ChangeLogId)
    );

    CREATE NONCLUSTERED INDEX IX_PolicyPackChangeLog_PackId_ChangedUtc
        ON dbo.PolicyPackChangeLog (PolicyPackId, ChangedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_PolicyPackChangeLog_TenantId_ChangedUtc
        ON dbo.PolicyPackChangeLog (TenantId, ChangedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.PolicyPackAssignments ADD RowVersionStamp ROWVERSION;

GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'BlockCommitOnCritical') IS NULL
    ALTER TABLE dbo.PolicyPackAssignments ADD BlockCommitOnCritical BIT NOT NULL
        CONSTRAINT DF_PolicyPackAssignments_BlockCommitOnCritical_Create DEFAULT (0);

GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'BlockCommitMinimumSeverity') IS NULL
    ALTER TABLE dbo.PolicyPackAssignments ADD BlockCommitMinimumSeverity INT NULL;

GO

/* ---- DbUp 038 parity: governance workflow tables (see Migrations/038_GovernanceWorkflow.sql) ----
   Greenfield CREATE with final column set so subsequent migration-parity ALTER blocks are no-ops.
   TenantId/WorkspaceId/ProjectId are NOT NULL from greenfield (migration 118 backfill only needed for
   legacy rows). FK to dbo.Tenants is added separately below after Tenants is created (per-tenant
   catalog topology: dbo.Tenants lives in the system catalog, not here). */

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceApprovalRequests
    (
        ApprovalRequestId    NVARCHAR(64)     NOT NULL CONSTRAINT PK_GovernanceApprovalRequests PRIMARY KEY,
        RunId                NVARCHAR(64)     NOT NULL,
        ManifestVersion      NVARCHAR(128)    NOT NULL,
        SourceEnvironment    NVARCHAR(64)     NOT NULL, -- DbUp 344 widened from 32 to 64; greenfield starts wide
        TargetEnvironment    NVARCHAR(64)     NOT NULL, -- DbUp 344
        Status               NVARCHAR(32)     NOT NULL,
        RequestedBy          NVARCHAR(200)    NOT NULL,
        ReviewedBy           NVARCHAR(200)    NULL,
        RequestComment       NVARCHAR(MAX)    NULL,
        ReviewComment        NVARCHAR(MAX)    NULL,
        RequestedUtc         DATETIME2        NOT NULL,
        ReviewedUtc          DATETIME2        NULL,
        SlaDeadlineUtc       DATETIME2        NULL,    -- DbUp 058
        SlaBreachNotifiedUtc DATETIME2        NULL,    -- DbUp 058
        RequestedByActorKey  NVARCHAR(256)    NULL,    -- DbUp 130
        ReviewedByActorKey   NVARCHAR(256)    NULL,    -- DbUp 130
        TenantId             UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        WorkspaceId          UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        ProjectId            UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        INDEX IX_GovernanceApprovalRequests_RunId NONCLUSTERED (RunId)
    );
END;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernancePromotionRecords
    (
        PromotionRecordId NVARCHAR(64)     NOT NULL CONSTRAINT PK_GovernancePromotionRecords PRIMARY KEY,
        RunId             NVARCHAR(64)     NOT NULL,
        ManifestVersion   NVARCHAR(128)    NOT NULL,
        SourceEnvironment NVARCHAR(64)     NOT NULL, -- DbUp 344 widened from 32 to 64; greenfield starts wide
        TargetEnvironment NVARCHAR(64)     NOT NULL, -- DbUp 344
        PromotedBy        NVARCHAR(200)    NOT NULL,
        PromotedUtc       DATETIME2        NOT NULL,
        ApprovalRequestId NVARCHAR(64)     NULL,
        Notes             NVARCHAR(MAX)    NULL,
        TenantId          UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        ProjectId         UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        INDEX IX_GovernancePromotionRecords_RunId NONCLUSTERED (RunId)
    );
END;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceEnvironmentActivations
    (
        ActivationId    NVARCHAR(64)     NOT NULL CONSTRAINT PK_GovernanceEnvironmentActivations PRIMARY KEY,
        RunId           NVARCHAR(64)     NOT NULL,
        ManifestVersion NVARCHAR(128)    NOT NULL,
        Environment     NVARCHAR(64)     NOT NULL, -- DbUp 143 widened from 32 to 64; greenfield starts wide
        IsActive        BIT              NOT NULL,
        ActivatedUtc    DATETIME2        NOT NULL,
        TenantId        UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        WorkspaceId     UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        ProjectId       UNIQUEIDENTIFIER NOT NULL, -- DbUp 118
        INDEX IX_GovernanceEnvironmentActivations_Environment_IsActive NONCLUSTERED (Environment, IsActive)
    );
END;

GO

/* ---- DbUp 058 parity: SLA tracking on governance approval requests ---- */

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'SlaDeadlineUtc') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD SlaDeadlineUtc DATETIME2 NULL;

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'SlaBreachNotifiedUtc') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD SlaBreachNotifiedUtc DATETIME2 NULL;

GO

/* ---- DbUp 130 parity: SoD canonical JWT actor keys (see ADR governance SoD oid) ---- */

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'RequestedByActorKey') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD RequestedByActorKey NVARCHAR(256) NULL;

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'ReviewedByActorKey') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD ReviewedByActorKey NVARCHAR(256) NULL;

GO

/* ---- DbUp 059 parity: SLA breach monitoring + blob upload failure indexes ---- */

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceApprovalRequests_PendingSlaBreached'
      AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_PendingSlaBreached
        ON dbo.GovernanceApprovalRequests (SlaDeadlineUtc ASC)
        INCLUDE (ApprovalRequestId, RunId, RequestedBy, Status)
        WHERE SlaDeadlineUtc IS NOT NULL AND SlaBreachNotifiedUtc IS NULL;
END

GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceApprovalRequests_Status_RequestedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_Status_RequestedUtc
        ON dbo.GovernanceApprovalRequests (Status, RequestedUtc DESC)
        INCLUDE (RunId, ManifestVersion, SourceEnvironment, TargetEnvironment);
END

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AgentExecutionTraces_BlobUploadFailed'
      AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_BlobUploadFailed
        ON dbo.AgentExecutionTraces (RunId, CreatedUtc DESC)
        WHERE BlobUploadFailed = 1;
END

GO

-- DbUp 065 parity: filtered index for traces where mandatory inline forensic fallback failed
IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'InlineFallbackFailed') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_AgentExecutionTraces_InlineFallbackFailed'
         AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_InlineFallbackFailed
        ON dbo.AgentExecutionTraces (RunId, CreatedUtc DESC)
        WHERE InlineFallbackFailed = 1;
END

GO

IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ProvenanceCorrelationId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_AgentExecutionTraces_ProvenanceCorrelationId'
         AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_ProvenanceCorrelationId
        ON dbo.AgentExecutionTraces (ProvenanceCorrelationId)
        WHERE ProvenanceCorrelationId IS NOT NULL;
END

GO

/* DbUp 301 parity: covering index for typed summary list (no TraceJson key lookup). */
IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_AgentExecutionTraces_RunId_CreatedUtc_Summary'
         AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_RunId_CreatedUtc_Summary
        ON dbo.AgentExecutionTraces (RunId, CreatedUtc)
        INCLUDE (
            TraceId,
            TaskId,
            AgentType,
            ParseSucceeded,
            ModelDeploymentName,
            BlobUploadFailed,
            InputTokenCount,
            OutputTokenCount,
            EstimatedCostUsd,
            ModelAlias,
            QualityWarning,
            QualityRejected);
END

GO

/* ---- DbUp 060 parity: broader query coverage indexes ---- */

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuditEvents_EventType_OccurredUtc'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_EventType_OccurredUtc
        ON dbo.AuditEvents (TenantId, WorkspaceId, ProjectId, EventType, OccurredUtc DESC);
END

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ConversationThreads_Scope_Active'
      AND object_id = OBJECT_ID(N'dbo.ConversationThreads'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ConversationThreads_Scope_Active
        ON dbo.ConversationThreads (TenantId, WorkspaceId, ProjectId, LastUpdatedUtc DESC)
        WHERE ArchivedUtc IS NULL;
END

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceEnvironmentActivations_RunId_ActivatedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_RunId_ActivatedUtc
        ON dbo.GovernanceEnvironmentActivations (RunId, ActivatedUtc DESC);
END

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceEnvironmentActivations_Environment_ActivatedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_Environment_ActivatedUtc
        ON dbo.GovernanceEnvironmentActivations (Environment, ActivatedUtc DESC)
        INCLUDE (RunId, ManifestVersion, IsActive);
END

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernancePromotionRecords_RunId_PromotedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernancePromotionRecords_RunId_PromotedUtc
        ON dbo.GovernancePromotionRecords (RunId, PromotedUtc DESC);
END

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_RecommendationRecords_Scope_Run_Priority'
      AND object_id = OBJECT_ID(N'dbo.RecommendationRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RecommendationRecords_Scope_Run_Priority
        ON dbo.RecommendationRecords (TenantId, WorkspaceId, ProjectId, RunId, PriorityScore DESC, CreatedUtc DESC);
END

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_RecommendationRecords_Scope_LastUpdatedUtc'
      AND object_id = OBJECT_ID(N'dbo.RecommendationRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RecommendationRecords_Scope_LastUpdatedUtc
        ON dbo.RecommendationRecords (TenantId, WorkspaceId, ProjectId, LastUpdatedUtc DESC);
END

GO

-- Require base user table (N'U'): after ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews.
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Runs_ArchiveRetention'
      AND object_id = OBJECT_ID(N'dbo.Runs', N'U'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Runs_ArchiveRetention
        ON dbo.Runs (CreatedUtc ASC)
        INCLUDE (TenantId, WorkspaceId, ScopeProjectId)
        WHERE ArchivedUtc IS NULL;
END

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_PolicyPackAssignments_Scope_Active'
      AND object_id = OBJECT_ID(N'dbo.PolicyPackAssignments'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_PolicyPackAssignments_Scope_Active
        ON dbo.PolicyPackAssignments (TenantId, ScopeLevel, AssignedUtc DESC)
        INCLUDE (WorkspaceId, ProjectId, PolicyPackId, IsEnabled, BlockCommitOnCritical, BlockCommitMinimumSeverity)
        WHERE ArchivedUtc IS NULL;
END

GO

/* -- First-wave CHECK constraints (obvious status domains only) ----
   dbo.Runs.LegacyRunStatus (nullable) may carry stringified ArchitectureRunStatus when populated by the application.
   No dbo.RunQueue table in this schema.
   No dbo.RecommendationActions table — workflow status is dbo.RecommendationRecords.Status (RecommendationStatus).
   Second-wave policy/alert/urgency domains: migration **095** + trailing **`ArchLucid.sql`** block (PolicyPacks.Status, AlertDeliveryAttempts.Status, severities, RecommendationRecords.Urgency).
*/
IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Status')
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_Status
        CHECK (Status IN (N'Proposed', N'Accepted', N'Rejected', N'Deferred', N'Implemented'));

GO

IF OBJECT_ID(N'dbo.AdvisoryScanExecutions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AdvisoryScanExecutions_Status')
    ALTER TABLE dbo.AdvisoryScanExecutions ADD CONSTRAINT CK_AdvisoryScanExecutions_Status
        CHECK (Status IN (N'Started', N'Completed', N'Failed'));

GO

IF OBJECT_ID(N'dbo.DigestDeliveryAttempts', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DigestDeliveryAttempts_Status')
    ALTER TABLE dbo.DigestDeliveryAttempts ADD CONSTRAINT CK_DigestDeliveryAttempts_Status
        CHECK (Status IN (N'Started', N'Succeeded', N'Failed'));

GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Status')
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT CK_AlertRecords_Status
        CHECK (Status IN (N'Open', N'Acknowledged', N'Resolved', N'Suppressed'));

GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_PackType')
    ALTER TABLE dbo.PolicyPacks ADD CONSTRAINT CK_PolicyPacks_PackType
        CHECK (PackType IN (
            N'BuiltIn', N'PlatformDefault', N'TenantCustom', N'WorkspaceCustom', N'ProjectCustom'));

GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPackAssignments_ScopeLevel')
    ALTER TABLE dbo.PolicyPackAssignments ADD CONSTRAINT CK_PolicyPackAssignments_ScopeLevel
        CHECK (ScopeLevel IN (N'Tenant', N'Workspace', N'Project'));

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_Severity')
    ALTER TABLE dbo.FindingRecords ADD CONSTRAINT CK_FindingRecords_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'Error', N'Critical'));

GO

IF OBJECT_ID(N'dbo.ConversationMessages', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ConversationMessages_Role')
    ALTER TABLE dbo.ConversationMessages ADD CONSTRAINT CK_ConversationMessages_Role
        CHECK (Role IN (N'User', N'Assistant', N'System'));

GO

IF OBJECT_ID(N'dbo.ImportedArchitectureRequests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImportedArchitectureRequests_Status')
    ALTER TABLE dbo.ImportedArchitectureRequests ADD CONSTRAINT CK_ImportedArchitectureRequests_Status
        CHECK (Status IN (N'Draft', N'Processing', N'Completed', N'Failed'));

GO

/* ---- DbUp 019–021 parity (post-bootstrap migrations; idempotent add for brownfield / reference) ---- */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RetrievalIndexingOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.RetrievalIndexingOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RetrievalIndexingOutbox PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_RetrievalIndexingOutbox_Pending
        ON dbo.RetrievalIndexingOutbox (ProcessedUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL;
END;

GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'AttemptCount') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD AttemptCount INT NOT NULL
        CONSTRAINT DF_RetrievalIndexingOutbox_AttemptCount DEFAULT ((0));
END;

GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'LockedUntilUtc') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD LockedUntilUtc DATETIME2(7) NULL;
END;

GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'NextAttemptUtc') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD NextAttemptUtc DATETIME2(7) NULL;
END;

GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'LastAttemptError') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD LastAttemptError NVARCHAR(400) NULL;
END;

GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'DeadLetteredUtc') IS NULL
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD DeadLetteredUtc DATETIME2(7) NULL;
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEventOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.IntegrationEventOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_IntegrationEventOutbox PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NULL,
        EventType NVARCHAR(256) NOT NULL,
        MessageId NVARCHAR(128) NULL,
        PayloadUtf8 VARBINARY(MAX) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Priority INT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL,
        RetryCount INT NOT NULL CONSTRAINT DF_IntegrationEventOutbox_RetryCount DEFAULT (0),
        NextRetryUtc DATETIME2 NULL,
        LastErrorMessage NVARCHAR(2048) NULL,
        DeadLetteredUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_IntegrationEventOutbox_Pending
        ON dbo.IntegrationEventOutbox (ProcessedUtc, NextRetryUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;

GO

IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IntegrationEventOutbox', N'Priority') IS NULL
BEGIN
    ALTER TABLE dbo.IntegrationEventOutbox ADD Priority INT NULL;
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuthorityPipelineWorkOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.AuthorityPipelineWorkOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuthorityPipelineWorkOutbox PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        PayloadJson NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_AuthorityPipelineWorkOutbox_Pending
        ON dbo.AuthorityPipelineWorkOutbox (ProcessedUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'AttemptCount') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD AttemptCount INT NOT NULL
        CONSTRAINT DF_AuthorityPipelineWorkOutbox_AttemptCount DEFAULT ((0));
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'LockedUntilUtc') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD LockedUntilUtc DATETIME2 NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'NextAttemptUtc') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD NextAttemptUtc DATETIME2 NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'LastAttemptError') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD LastAttemptError NVARCHAR(400) NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'DeadLetteredUtc') IS NULL
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD DeadLetteredUtc DATETIME2 NULL;
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CosmosGraphSnapshotOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.CosmosGraphSnapshotOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CosmosGraphSnapshotOutbox PRIMARY KEY,
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL,
        AttemptCount INT NOT NULL CONSTRAINT DF_CosmosGraphSnapshotOutbox_AttemptCount DEFAULT ((0)),
        LockedUntilUtc DATETIME2 NULL,
        NextAttemptUtc DATETIME2 NULL,
        LastAttemptError NVARCHAR(400) NULL,
        DeadLetteredUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_CosmosGraphSnapshotOutbox_Pending
        ON dbo.CosmosGraphSnapshotOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RunExportBlobPushOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.RunExportBlobPushOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RunExportBlobPushOutbox PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        DestinationSasUrl NVARCHAR(2048) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL,
        AttemptCount INT NOT NULL CONSTRAINT DF_RunExportBlobPushOutbox_AttemptCount DEFAULT ((0)),
        LockedUntilUtc DATETIME2 NULL,
        NextAttemptUtc DATETIME2 NULL,
        LastAttemptError NVARCHAR(400) NULL,
        DeadLetteredUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_RunExportBlobPushOutbox_Pending
        ON dbo.RunExportBlobPushOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PostCommitProjectionOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.PostCommitProjectionOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PostCommitProjectionOutbox PRIMARY KEY,
        WorkType NVARCHAR(64) NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        PayloadJson NVARCHAR(MAX) NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL,
        AttemptCount INT NOT NULL CONSTRAINT DF_PostCommitProjectionOutbox_AttemptCount DEFAULT ((0)),
        LockedUntilUtc DATETIME2 NULL,
        NextAttemptUtc DATETIME2 NULL,
        LastAttemptError NVARCHAR(400) NULL,
        DeadLetteredUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_PostCommitProjectionOutbox_Pending
        ON dbo.PostCommitProjectionOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;

GO

/* DbUp 328 parity: recoverable outbox pending indexes (see Migrations/328_RecoverableOutbox_PendingIndexes.sql). */
IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RetrievalIndexingOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox')
         AND (
             filter_definition IS NULL
             OR filter_definition NOT LIKE N'%DeadLetteredUtc%'
             OR NOT EXISTS (
                 SELECT 1
                 FROM sys.index_columns AS ic
                 INNER JOIN sys.columns AS c
                     ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                 WHERE ic.object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox')
                   AND ic.index_id = (
                       SELECT index_id
                       FROM sys.indexes
                       WHERE name = N'IX_RetrievalIndexingOutbox_Pending'
                         AND object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox'))
                   AND c.name = N'NextAttemptUtc'
                   AND ic.is_included_column = 0
                   AND ic.key_ordinal = 1)))
BEGIN
    DROP INDEX IX_RetrievalIndexingOutbox_Pending ON dbo.RetrievalIndexingOutbox;

    CREATE NONCLUSTERED INDEX IX_RetrievalIndexingOutbox_Pending
        ON dbo.RetrievalIndexingOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;

GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'AttemptCount') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RetrievalIndexingOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RetrievalIndexingOutbox_PendingWithRetries
        ON dbo.RetrievalIndexingOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AuthorityPipelineWorkOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox')
         AND (
             filter_definition IS NULL
             OR filter_definition NOT LIKE N'%DeadLetteredUtc%'
             OR NOT EXISTS (
                 SELECT 1
                 FROM sys.index_columns AS ic
                 INNER JOIN sys.columns AS c
                     ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                 WHERE ic.object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox')
                   AND ic.index_id = (
                       SELECT index_id
                       FROM sys.indexes
                       WHERE name = N'IX_AuthorityPipelineWorkOutbox_Pending'
                         AND object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox'))
                   AND c.name = N'NextAttemptUtc'
                   AND ic.is_included_column = 0
                   AND ic.key_ordinal = 1)))
BEGIN
    DROP INDEX IX_AuthorityPipelineWorkOutbox_Pending ON dbo.AuthorityPipelineWorkOutbox;

    CREATE NONCLUSTERED INDEX IX_AuthorityPipelineWorkOutbox_Pending
        ON dbo.AuthorityPipelineWorkOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'AttemptCount') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AuthorityPipelineWorkOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuthorityPipelineWorkOutbox_PendingWithRetries
        ON dbo.AuthorityPipelineWorkOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;

GO

IF OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_CosmosGraphSnapshotOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CosmosGraphSnapshotOutbox_PendingWithRetries
        ON dbo.CosmosGraphSnapshotOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;

GO

IF OBJECT_ID(N'dbo.RunExportBlobPushOutbox', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RunExportBlobPushOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.RunExportBlobPushOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RunExportBlobPushOutbox_PendingWithRetries
        ON dbo.RunExportBlobPushOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;

GO

IF OBJECT_ID(N'dbo.PostCommitProjectionOutbox', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_PostCommitProjectionOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.PostCommitProjectionOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_PostCommitProjectionOutbox_PendingWithRetries
        ON dbo.PostCommitProjectionOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ArchitectureRunIdempotency' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ArchitectureRunIdempotency
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        IdempotencyKeyHash VARBINARY(32) NOT NULL,
        RequestFingerprint VARBINARY(32) NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CONSTRAINT PK_ArchitectureRunIdempotency PRIMARY KEY (TenantId, WorkspaceId, ProjectId, IdempotencyKeyHash),
        CONSTRAINT FK_ArchitectureRunIdempotency_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );
END;

GO

/* ---- DbUp 159 parity: commit idempotency + project RBAC overlays ---- */

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CommitRunIdempotency' AND schema_id = SCHEMA_ID('dbo'))
   AND OBJECT_ID(N'dbo.CommitRunIdempotency') IS NULL
   AND OBJECT_ID(N'dbo.FinalizeReviewIdempotency', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CommitRunIdempotency
    (
        TenantId           UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId        UNIQUEIDENTIFIER NOT NULL,
        ProjectId          UNIQUEIDENTIFIER NOT NULL,
        RunId              UNIQUEIDENTIFIER NOT NULL,
        IdempotencyKeyHash VARBINARY(32)     NOT NULL,
        RequestFingerprint VARBINARY(32)     NOT NULL,
        CreatedUtc          DATETIME2(7)     NOT NULL CONSTRAINT DF_CommitRunIdempotency_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_CommitRunIdempotency PRIMARY KEY (TenantId, WorkspaceId, ProjectId, RunId, IdempotencyKeyHash),
        -- FK_CommitRunIdempotency_Tenants is added below after dbo.Tenants is created (ordering fix).
        -- In SystemWithPerTenantCatalogs mode dbo.Tenants lives in the system catalog; the guarded
        -- ALTER TABLE below is a no-op on tenant catalogs and adds the FK on single-catalog installs.
        CONSTRAINT FK_CommitRunIdempotency_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CommitRunIdempotency_Scope_Key' AND object_id = OBJECT_ID(N'dbo.CommitRunIdempotency'))
   AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX IX_CommitRunIdempotency_Scope_Key
        ON dbo.CommitRunIdempotency (TenantId, WorkspaceId, ProjectId, IdempotencyKeyHash);
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ProjectRoleAssignments' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.ProjectRoleAssignments
    (
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId   UNIQUEIDENTIFIER NOT NULL,
        UserId      UNIQUEIDENTIFIER NOT NULL,
        Role        NVARCHAR(32)      NOT NULL,
        CreatedUtc  DATETIME2(7)     NOT NULL CONSTRAINT DF_ProjectRoleAssignments_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ProjectRoleAssignments PRIMARY KEY (TenantId, ProjectId, UserId),
        -- FK_ProjectRoleAssignments_Tenants is added below after dbo.Tenants is created (ordering fix).
        -- FK_ProjectRoleAssignments_ScimUsers is added below after dbo.ScimUsers is created (ordering fix).
        CONSTRAINT CK_ProjectRoleAssignments_Role CHECK (Role IN (N'Reader', N'Operator', N'ProjectAdmin'))
    );
END;

GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProjectRoleAssignments_User_Scope' AND object_id = OBJECT_ID(N'dbo.ProjectRoleAssignments'))
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProjectRoleAssignments_User_Scope
        ON dbo.ProjectRoleAssignments (TenantId, WorkspaceId, ProjectId, UserId)
        INCLUDE (Role);
END;

GO

-- Require base user table (N'U'): after ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews.
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Runs_Scope_Project_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.Runs', N'U'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Runs_Scope_Project_CreatedUtc
        ON dbo.Runs (TenantId, WorkspaceId, ScopeProjectId, ProjectId, CreatedUtc DESC);
END;

GO

/* ---- DbUp 028 parity: soft archival flags (retention job sets ArchivedUtc; reads filter active rows) ---- */

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.Runs', 'ArchivedUtc') IS NULL
    ALTER TABLE dbo.Runs ADD ArchivedUtc DATETIME2 NULL;

/* ---- DbUp 048 parity: lifecycle / request columns on dbo.Runs ---- */

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'ArchitectureRequestId') IS NULL
    ALTER TABLE dbo.Runs ADD ArchitectureRequestId NVARCHAR(64) NULL;

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'LegacyRunStatus') IS NULL
    ALTER TABLE dbo.Runs ADD LegacyRunStatus NVARCHAR(64) NULL;

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'CompletedUtc') IS NULL
    ALTER TABLE dbo.Runs ADD CompletedUtc DATETIME2 NULL;

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'CurrentManifestVersion') IS NULL
    ALTER TABLE dbo.Runs ADD CurrentManifestVersion NVARCHAR(128) NULL;

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OtelTraceId') IS NULL
    ALTER TABLE dbo.Runs ADD OtelTraceId NVARCHAR(64) NULL;

/* DbUp 061 parity: covering list index for dbo.Runs scope + CreatedUtc DESC (avoids key lookups into clustered PK under concurrent writes). */
-- Require base user table (N'U'): after ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews.
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Runs_Scope_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.Runs', N'U'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Runs_Scope_CreatedUtc
        ON dbo.Runs (TenantId, WorkspaceId, ScopeProjectId, CreatedUtc DESC)
        INCLUDE (
            RunId,
            ProjectId,
            Description,
            ContextSnapshotId,
            GraphSnapshotId,
            FindingsSnapshotId,
            GoldenManifestId,
            DecisionTraceId,
            ArtifactBundleId,
            ArchitectureRequestId,
            LegacyRunStatus,
            CompletedUtc,
            CurrentManifestVersion,
            OtelTraceId,
            IsDemoWelcomeRun,
            IsPublicShowcase,
            IsPinned,
            IsSample,
            RealModeFellBackToSimulator,
            PilotAoaiDeploymentSnapshot,
            StructuralExecutionMode,
            RetryCount,
            LastFailureReason)
        WHERE ArchivedUtc IS NULL;
END;

GO

/* DbUp 327 parity: architecture-request idempotency seeks (see Migrations/327_Runs_Scope_ArchitectureRequestId_Index.sql). */
IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'ArchitectureRequestId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_Runs_Scope_ArchitectureRequestId'
         AND object_id = OBJECT_ID(N'dbo.Runs', N'U'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Runs_Scope_ArchitectureRequestId
        ON dbo.Runs (TenantId, WorkspaceId, ScopeProjectId, ArchitectureRequestId)
        WHERE ArchivedUtc IS NULL;
END;

GO

/* DbUp 202 parity: filtered indexes for run-list EXISTS predicates (HasWarnings / open alerts). */
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_FindingsSnapshots_HasWarnings_RunId'
      AND object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FindingsSnapshots_HasWarnings_RunId
        ON dbo.FindingsSnapshots (RunId)
        WHERE ArchivedUtc IS NULL AND HasWarnings = 1;
END;

GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_AlertRecords_RunId_Open'
      AND object_id = OBJECT_ID(N'dbo.AlertRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AlertRecords_RunId_Open
        ON dbo.AlertRecords (RunId)
        WHERE Status = N'Open';
END;

GO

IF OBJECT_ID(N'dbo.ArchitectureDigests', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.ArchitectureDigests', 'ArchivedUtc') IS NULL
    ALTER TABLE dbo.ArchitectureDigests ADD ArchivedUtc DATETIME2 NULL;

IF OBJECT_ID(N'dbo.ConversationThreads', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.ConversationThreads', 'ArchivedUtc') IS NULL
    ALTER TABLE dbo.ConversationThreads ADD ArchivedUtc DATETIME2 NULL;

/* ---- DbUp 029 parity: policy pack assignment archival (excluded from effective governance lists) ---- */

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.PolicyPackAssignments', 'ArchivedUtc') IS NULL
    ALTER TABLE dbo.PolicyPackAssignments ADD ArchivedUtc DATETIME2 NULL;

/* RLS DDL moved to end of script (after all referenced tables exist); see "DbUp 036 parity" section. */

/* ---- DbUp 031 parity: product learning pilot signals (58R) ---- */

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductLearningPilotSignals
    (
        SignalId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ProductLearningPilotSignals PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ArchitectureRunId UNIQUEIDENTIFIER NULL,
        AuthorityRunId UNIQUEIDENTIFIER NULL,
        ManifestVersion NVARCHAR(128) NULL,
        SubjectType NVARCHAR(64) NOT NULL,
        Disposition NVARCHAR(32) NOT NULL,
        PatternKey NVARCHAR(200) NULL,
        ArtifactHint NVARCHAR(512) NULL,
        CommentShort NVARCHAR(2000) NULL,
        DetailJson NVARCHAR(MAX) NULL,
        RecordedByUserId NVARCHAR(256) NULL,
        RecordedByDisplayName NVARCHAR(256) NULL,
        RecordedUtc DATETIME2 NOT NULL,
        TriageStatus NVARCHAR(32) NOT NULL CONSTRAINT DF_ProductLearningPilotSignals_TriageStatus DEFAULT (N'Open'),
        INDEX IX_ProductLearningPilotSignals_Scope_RecordedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, RecordedUtc DESC),
        INDEX IX_ProductLearningPilotSignals_Scope_Disposition NONCLUSTERED (TenantId, WorkspaceId, ProjectId, Disposition, RecordedUtc DESC),
        INDEX IX_ProductLearningPilotSignals_Scope_PatternKey_Filtered NONCLUSTERED (TenantId, WorkspaceId, ProjectId, PatternKey, RecordedUtc DESC)
            WHERE PatternKey IS NOT NULL
    );
END;

GO

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ProductLearningPilotSignals_Disposition')
    ALTER TABLE dbo.ProductLearningPilotSignals ADD CONSTRAINT CK_ProductLearningPilotSignals_Disposition
        CHECK (Disposition IN (N'Trusted', N'Rejected', N'Revised', N'NeedsFollowUp'));

GO

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ProductLearningPilotSignals_TriageStatus')
    ALTER TABLE dbo.ProductLearningPilotSignals ADD CONSTRAINT CK_ProductLearningPilotSignals_TriageStatus
        CHECK (TriageStatus IN (N'Open', N'Triaged', N'Backlog', N'Done', N'WontFix'));

GO

/* ---- DbUp 032 parity: learning-to-planning bridge (59R) ---- */

IF OBJECT_ID(N'dbo.ProductLearningImprovementThemes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductLearningImprovementThemes
    (
        ThemeId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ProductLearningImprovementThemes PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ThemeKey NVARCHAR(256) NOT NULL,
        SourceAggregateKey NVARCHAR(450) NULL,
        PatternKey NVARCHAR(200) NULL,
        Title NVARCHAR(512) NOT NULL,
        Summary NVARCHAR(MAX) NOT NULL,
        AffectedArtifactTypeOrWorkflowArea NVARCHAR(512) NOT NULL,
        SeverityBand NVARCHAR(32) NOT NULL,
        EvidenceSignalCount INT NOT NULL,
        DistinctRunCount INT NOT NULL,
        AverageTrustScore FLOAT NULL,
        DerivationRuleVersion NVARCHAR(64) NOT NULL,
        Status NVARCHAR(32) NOT NULL CONSTRAINT DF_ProductLearningImprovementThemes_Status DEFAULT (N'Proposed'),
        CreatedUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NULL,
        CONSTRAINT UQ_ProductLearningImprovementThemes_Scope_ThemeKey UNIQUE (TenantId, WorkspaceId, ProjectId, ThemeKey),
        INDEX IX_ProductLearningImprovementThemes_Scope_CreatedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC)
    );
END;

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementThemes', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ProductLearningImprovementThemes_Status')
    ALTER TABLE dbo.ProductLearningImprovementThemes ADD CONSTRAINT CK_ProductLearningImprovementThemes_Status
        CHECK (Status IN (N'Proposed', N'Accepted', N'Superseded', N'Archived'));

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductLearningImprovementPlans
    (
        PlanId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ProductLearningImprovementPlans PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ThemeId UNIQUEIDENTIFIER NOT NULL,
        Title NVARCHAR(512) NOT NULL,
        Summary NVARCHAR(MAX) NOT NULL,
        BoundedActionsJson NVARCHAR(MAX) NOT NULL,
        PriorityScore INT NOT NULL,
        PriorityExplanation NVARCHAR(MAX) NULL,
        Status NVARCHAR(32) NOT NULL CONSTRAINT DF_ProductLearningImprovementPlans_Status DEFAULT (N'Proposed'),
        CreatedUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NULL,
        INDEX IX_ProductLearningImprovementPlans_Scope_CreatedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC),
        INDEX IX_ProductLearningImprovementPlans_ThemeId NONCLUSTERED (ThemeId),
        CONSTRAINT FK_ProductLearningImprovementPlans_Theme FOREIGN KEY (ThemeId)
            REFERENCES dbo.ProductLearningImprovementThemes (ThemeId)
    );
END;

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlans', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ProductLearningImprovementPlans_Status')
    ALTER TABLE dbo.ProductLearningImprovementPlans ADD CONSTRAINT CK_ProductLearningImprovementPlans_Status
        CHECK (Status IN (N'Proposed', N'UnderReview', N'Approved', N'Rejected', N'Completed'));

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanArchitectureRuns', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductLearningImprovementPlanArchitectureRuns
    (
        PlanId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        ArchitectureRunId NVARCHAR(64) NOT NULL,
        CONSTRAINT PK_ProductLearningImprovementPlanArchitectureRuns PRIMARY KEY (PlanId, ArchitectureRunId),
        CONSTRAINT FK_ProductLearningImprovementPlanArchitectureRuns_Plan FOREIGN KEY (PlanId)
            REFERENCES dbo.ProductLearningImprovementPlans (PlanId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ProductLearningImprovementPlanArchitectureRuns_PlanId
        ON dbo.ProductLearningImprovementPlanArchitectureRuns (PlanId);
END;

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanSignalLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductLearningImprovementPlanSignalLinks
    (
        PlanId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        SignalId UNIQUEIDENTIFIER NOT NULL,
        TriageStatusSnapshot NVARCHAR(32) NULL,
        CONSTRAINT PK_ProductLearningImprovementPlanSignalLinks PRIMARY KEY (PlanId, SignalId),
        CONSTRAINT FK_ProductLearningImprovementPlanSignalLinks_Plan FOREIGN KEY (PlanId)
            REFERENCES dbo.ProductLearningImprovementPlans (PlanId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ProductLearningImprovementPlanSignalLinks_PlanId
        ON dbo.ProductLearningImprovementPlanSignalLinks (PlanId);
END;

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanSignalLinks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProductLearningImprovementPlanSignalLinks_Signal')
    ALTER TABLE dbo.ProductLearningImprovementPlanSignalLinks ADD CONSTRAINT FK_ProductLearningImprovementPlanSignalLinks_Signal
        FOREIGN KEY (SignalId) REFERENCES dbo.ProductLearningPilotSignals (SignalId);

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanSignalLinks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ProductLearningImprovementPlanSignalLinks_TriageSnapshot')
    ALTER TABLE dbo.ProductLearningImprovementPlanSignalLinks ADD CONSTRAINT CK_ProductLearningImprovementPlanSignalLinks_TriageSnapshot
        CHECK (
            TriageStatusSnapshot IS NULL OR TriageStatusSnapshot IN (N'Open', N'Triaged', N'Backlog', N'Done', N'WontFix')
        );

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanArtifactLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductLearningImprovementPlanArtifactLinks
    (
        LinkId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ProductLearningImprovementPlanArtifactLinks PRIMARY KEY,
        PlanId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        AuthorityBundleId UNIQUEIDENTIFIER NULL,
        AuthorityArtifactSortOrder INT NULL,
        PilotArtifactHint NVARCHAR(512) NULL,
        CONSTRAINT FK_ProductLearningImprovementPlanArtifactLinks_Plan FOREIGN KEY (PlanId)
            REFERENCES dbo.ProductLearningImprovementPlans (PlanId) ON DELETE CASCADE,
        CONSTRAINT CK_ProductLearningImprovementPlanArtifactLinks_Target
            CHECK (
                (AuthorityBundleId IS NOT NULL AND AuthorityArtifactSortOrder IS NOT NULL)
                OR (PilotArtifactHint IS NOT NULL)
            )
    );

    CREATE NONCLUSTERED INDEX IX_ProductLearningImprovementPlanArtifactLinks_PlanId
        ON dbo.ProductLearningImprovementPlanArtifactLinks (PlanId);
END;

GO

IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanArtifactLinks', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProductLearningImprovementPlanArtifactLinks_BundleArtifact')
    ALTER TABLE dbo.ProductLearningImprovementPlanArtifactLinks ADD CONSTRAINT FK_ProductLearningImprovementPlanArtifactLinks_BundleArtifact
        FOREIGN KEY (AuthorityBundleId, AuthorityArtifactSortOrder) REFERENCES dbo.ArtifactBundleArtifacts (BundleId, SortOrder);

GO

/* ---- DbUp 033 parity: evolution simulation (60R) ---- */

IF OBJECT_ID(N'dbo.EvolutionCandidateChangeSets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EvolutionCandidateChangeSets
    (
        CandidateChangeSetId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EvolutionCandidateChangeSets PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SourcePlanId UNIQUEIDENTIFIER NOT NULL,
        Status NVARCHAR(32) NOT NULL CONSTRAINT DF_EvolutionCandidateChangeSets_Status DEFAULT (N'Draft'),
        Title NVARCHAR(512) NOT NULL,
        Summary NVARCHAR(MAX) NOT NULL,
        PlanSnapshotJson NVARCHAR(MAX) NOT NULL,
        DerivationRuleVersion NVARCHAR(64) NOT NULL CONSTRAINT DF_EvolutionCandidateChangeSets_RuleVersion DEFAULT (N'60R-v1'),
        CreatedUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NULL,
        INDEX IX_EvolutionCandidateChangeSets_Scope_CreatedUtc NONCLUSTERED (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC),
        INDEX IX_EvolutionCandidateChangeSets_SourcePlanId NONCLUSTERED (SourcePlanId),
        CONSTRAINT FK_EvolutionCandidateChangeSets_Plan FOREIGN KEY (SourcePlanId)
            REFERENCES dbo.ProductLearningImprovementPlans (PlanId)
    );
END;

GO

IF OBJECT_ID(N'dbo.EvolutionCandidateChangeSets', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_EvolutionCandidateChangeSets_Status')
    ALTER TABLE dbo.EvolutionCandidateChangeSets ADD CONSTRAINT CK_EvolutionCandidateChangeSets_Status
        CHECK (Status IN (N'Draft', N'Simulated', N'PendingHumanReview', N'Declined', N'Archived'));

GO

IF OBJECT_ID(N'dbo.EvolutionSimulationRuns', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EvolutionSimulationRuns
    (
        SimulationRunId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_EvolutionSimulationRuns PRIMARY KEY,
        CandidateChangeSetId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NULL,
        WorkspaceId UNIQUEIDENTIFIER NULL,
        ProjectId UNIQUEIDENTIFIER NULL,
        BaselineArchitectureRunId NVARCHAR(64) NOT NULL,
        EvaluationMode NVARCHAR(64) NOT NULL,
        OutcomeJson NVARCHAR(MAX) NOT NULL,
        WarningsJson NVARCHAR(MAX) NULL,
        CompletedUtc DATETIME2 NOT NULL,
        IsShadowOnly BIT NOT NULL CONSTRAINT DF_EvolutionSimulationRuns_IsShadowOnly DEFAULT (1),
        CONSTRAINT FK_EvolutionSimulationRuns_Candidate FOREIGN KEY (CandidateChangeSetId)
            REFERENCES dbo.EvolutionCandidateChangeSets (CandidateChangeSetId) ON DELETE CASCADE,
        INDEX IX_EvolutionSimulationRuns_CandidateId NONCLUSTERED (CandidateChangeSetId)
    );
END;

GO

IF OBJECT_ID(N'dbo.EvolutionSimulationRuns', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_EvolutionSimulationRuns_EvaluationMode')
    ALTER TABLE dbo.EvolutionSimulationRuns ADD CONSTRAINT CK_EvolutionSimulationRuns_EvaluationMode
        CHECK (EvaluationMode IN (N'ReadOnlyArchitectureAnalysis'));

GO

IF OBJECT_ID(N'dbo.EvolutionSimulationRuns', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_EvolutionSimulationRuns_ShadowOnly')
    ALTER TABLE dbo.EvolutionSimulationRuns ADD CONSTRAINT CK_EvolutionSimulationRuns_ShadowOnly
        CHECK (IsShadowOnly = 1);

GO

/* ---- Large artifact blob pointers (see Migrations/034_LargeArtifactBlobPointers.sql) ---- */
IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ManifestPayloadBlobUri') IS NULL
    ALTER TABLE dbo.GoldenManifests ADD ManifestPayloadBlobUri NVARCHAR(2000) NULL;

GO

IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArtifactBundles', N'BundlePayloadBlobUri') IS NULL
    ALTER TABLE dbo.ArtifactBundles ADD BundlePayloadBlobUri NVARCHAR(2000) NULL;

GO

IF OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArtifactBundleArtifacts', N'ContentBlobUri') IS NULL
    ALTER TABLE dbo.ArtifactBundleArtifacts ADD ContentBlobUri NVARCHAR(2000) NULL;

GO

/* Brownfield: per-artifact generation status (DbUp 127 parity). */
IF OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArtifactBundleArtifacts', N'GenerationStatus') IS NULL
    ALTER TABLE dbo.ArtifactBundleArtifacts ADD GenerationStatus NVARCHAR(32) NOT NULL
        CONSTRAINT DF_ArtifactBundleArtifacts_GenerationStatus_Master DEFAULT (N'Generated');

GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ArtifactBundleArtifacts_GenerationStatus')
   AND OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NOT NULL
    ALTER TABLE dbo.ArtifactBundleArtifacts ADD CONSTRAINT CK_ArtifactBundleArtifacts_GenerationStatus
        CHECK (GenerationStatus IN (N'Pending', N'Generated', N'Failed'));

GO

/* ---- Durable background export jobs (queue + worker) ---- */
IF OBJECT_ID(N'dbo.BackgroundJobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BackgroundJobs
    (
        JobId           NVARCHAR(32)  NOT NULL CONSTRAINT PK_BackgroundJobs PRIMARY KEY,
        WorkUnitJson    NVARCHAR(MAX) NOT NULL,
        State           NVARCHAR(16)  NOT NULL,
        CreatedUtc      DATETIME2     NOT NULL,
        StartedUtc      DATETIME2     NULL,
        CompletedUtc    DATETIME2     NULL,
        Error           NVARCHAR(MAX) NULL,
        FileName        NVARCHAR(512) NULL,
        ContentType     NVARCHAR(256) NULL,
        RetryCount      INT           NOT NULL CONSTRAINT DF_BackgroundJobs_RetryCount DEFAULT (0),
        MaxRetries      INT           NOT NULL CONSTRAINT DF_BackgroundJobs_MaxRetries DEFAULT (0),
        ResultBlobName  NVARCHAR(1024) NULL,
        RowVersionStamp ROWVERSION,
        INDEX IX_BackgroundJobs_State_CreatedUtc NONCLUSTERED (State, CreatedUtc)
    );
END;

GO

IF OBJECT_ID(N'dbo.BackgroundJobs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_BackgroundJobs_State')
    ALTER TABLE dbo.BackgroundJobs ADD CONSTRAINT CK_BackgroundJobs_State
        CHECK (State IN (N'Pending', N'Running', N'Succeeded', N'Failed'));

GO

IF OBJECT_ID(N'dbo.BackgroundJobs', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_BackgroundJobs_State_StartedUtc_Running'
         AND object_id = OBJECT_ID(N'dbo.BackgroundJobs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_BackgroundJobs_State_StartedUtc_Running
        ON dbo.BackgroundJobs (StartedUtc DESC)
        WHERE State = N'Running';
END;

GO

/* ---- Host leader leases (singleton hosted services; see Migrations/035_AuditProvenanceConversationTables.sql) ---- */
IF OBJECT_ID(N'dbo.HostLeaderLeases', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HostLeaderLeases
    (
        LeaseName        NVARCHAR(128) NOT NULL CONSTRAINT PK_HostLeaderLeases PRIMARY KEY,
        HolderInstanceId NVARCHAR(256) NOT NULL,
        LeaseExpiresUtc  DATETIME2     NOT NULL
    );
END;

GO

/* Tenant isolation: SQL RLS removed (DbUp 148). Denormalized TenantId / WorkspaceId / ProjectId columns remain for query predicates. */



/* ---- Tenant registry + usage metering (DbUp 069–070 parity; greenfield) ---- */

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tenants
    (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Tenants PRIMARY KEY,
        Name             NVARCHAR(200)    NOT NULL,
        Slug             NVARCHAR(100)    NOT NULL,
        Tier             NVARCHAR(32)     NOT NULL CONSTRAINT DF_Tenants_Tier DEFAULT N'Standard',
        CreatedUtc       DATETIMEOFFSET   NOT NULL CONSTRAINT DF_Tenants_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        SuspendedUtc     DATETIMEOFFSET   NULL,
        EntraTenantId    UNIQUEIDENTIFIER NULL,
        CONSTRAINT UQ_Tenants_Slug2 UNIQUE (Slug)
    );
END;

GO

/* ---- Deferred FKs to dbo.Tenants: added after dbo.Tenants is created above ----
   These constraints were previously inline in CREATE TABLE which ran before dbo.Tenants existed,
   causing 'FK_CommitRunIdempotency_Tenants references invalid table dbo.Tenants' on greenfield.
   Guard with OBJECT_ID(N'dbo.Tenants') so they are no-ops in SystemWithPerTenantCatalogs mode
   where dbo.Tenants is in the system catalog, not the tenant catalog. */

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CommitRunIdempotency_Tenants')
    ALTER TABLE dbo.CommitRunIdempotency
        ADD CONSTRAINT FK_CommitRunIdempotency_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProjectRoleAssignments_Tenants')
    ALTER TABLE dbo.ProjectRoleAssignments
        ADD CONSTRAINT FK_ProjectRoleAssignments_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);

GO

/* ---- Tenant ROI cost assumptions (DbUp 184 + 199 parity; greenfield) ---- */

IF OBJECT_ID(N'dbo.TenantCostSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantCostSettings
    (
        TenantId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantCostSettings PRIMARY KEY
            CONSTRAINT FK_TenantCostSettings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        ArchitectHourlyRateUsd DECIMAL(18, 2) NOT NULL,
        AverageIncidentCostUsd DECIMAL(18, 2) NOT NULL,
        EaDiscountMultiplier DECIMAL(6, 4) NOT NULL
            CONSTRAINT DF_TenantCostSettings_EaDiscountMultiplier DEFAULT (1.0000),
        UpdatedUtc DATETIME2(7) NOT NULL
            CONSTRAINT DF_TenantCostSettings_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedByActorId NVARCHAR(256) NULL,
        CONSTRAINT CK_TenantCostSettings_ArchitectHourlyRateUsd
            CHECK (ArchitectHourlyRateUsd > 0 AND ArchitectHourlyRateUsd <= 10000),
        CONSTRAINT CK_TenantCostSettings_AverageIncidentCostUsd
            CHECK (AverageIncidentCostUsd > 0 AND AverageIncidentCostUsd <= 10000000),
        CONSTRAINT CK_TenantCostSettings_EaDiscountMultiplier
            CHECK (EaDiscountMultiplier > 0 AND EaDiscountMultiplier <= 1)
    );
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'EntraTenantId') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD EntraTenantId UNIQUEIDENTIFIER NULL;
END;

GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tenants_EntraTenantId'
      AND object_id = OBJECT_ID(N'dbo.Tenants', N'U')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Tenants_EntraTenantId
        ON dbo.Tenants (EntraTenantId)
        WHERE EntraTenantId IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TrialStartUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        TrialStartUtc      DATETIMEOFFSET   NULL,
        TrialExpiresUtc    DATETIMEOFFSET   NULL,
        TrialRunsLimit     INT              NULL,
        TrialRunsUsed      INT              NOT NULL CONSTRAINT DF_Tenants_TrialRunsUsed DEFAULT 0,
        TrialSeatsLimit    INT              NULL,
        TrialSeatsUsed     INT              NOT NULL CONSTRAINT DF_Tenants_TrialSeatsUsed DEFAULT 0,
        TrialStatus        NVARCHAR(32)     NULL,
        TrialSampleRunId   UNIQUEIDENTIFIER NULL;
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedEnqueuedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TrialArchitecturePreseedEnqueuedUtc DATETIMEOFFSET NULL;
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedAttemptCount') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        TrialArchitecturePreseedAttemptCount INT NOT NULL
            CONSTRAINT DF_Tenants_TrialArchitecturePreseedAttemptCount DEFAULT (0),
        TrialArchitecturePreseedFailedUtc DATETIMEOFFSET NULL,
        TrialArchitecturePreseedLastError NVARCHAR(2048) NULL;
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TrialWelcomeRunId') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TrialWelcomeRunId UNIQUEIDENTIFIER NULL;
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'BaselineReviewCycleHours') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        BaselineReviewCycleHours DECIMAL(9,2) NULL,
        BaselineReviewCycleSource NVARCHAR(256) NULL,
        BaselineReviewCycleCapturedUtc DATETIMEOFFSET(7) NULL;
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Tenants', N'BaselineReviewCycleHours') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_Tenants_BaselineReviewCycleHours_Positive'
         AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_BaselineReviewCycleHours_Positive
        CHECK (BaselineReviewCycleHours IS NULL OR BaselineReviewCycleHours > 0);
END;

GO

/* 115: Structured baseline (see Migrations/115_Tenants_StructuredBaseline.sql). */
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'BaselineManualPrepHoursPerReview') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        BaselineManualPrepHoursPerReview     DECIMAL(9,2)     NULL,
        BaselinePeoplePerReview              INT              NULL,
        BaselineManualPrepCapturedUtc        DATETIMEOFFSET(7) NULL,
        CompanySize                          NVARCHAR(30)     NULL,
        ArchitectureTeamSize                 INT              NULL,
        IndustryVertical                     NVARCHAR(100)    NULL,
        IndustryVerticalOther                NVARCHAR(200)    NULL;
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Tenants', N'BaselineManualPrepHoursPerReview') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_Tenants_BaselineManualPrepHoursPerReview_Positive'
         AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_BaselineManualPrepHoursPerReview_Positive
        CHECK (BaselineManualPrepHoursPerReview IS NULL OR BaselineManualPrepHoursPerReview > 0);
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Tenants', N'BaselinePeoplePerReview') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_Tenants_BaselinePeoplePerReview_Positive'
         AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_BaselinePeoplePerReview_Positive
        CHECK (BaselinePeoplePerReview IS NULL OR BaselinePeoplePerReview > 0);
END;

GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Tenants', N'ArchitectureTeamSize') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_Tenants_ArchitectureTeamSize_Positive'
         AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_ArchitectureTeamSize_Positive
        CHECK (ArchitectureTeamSize IS NULL OR ArchitectureTeamSize > 0);
END;

GO

IF OBJECT_ID(N'dbo.TenantTrialSeatOccupants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantTrialSeatOccupants
    (
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        PrincipalKey   NVARCHAR(450)    NOT NULL,
        CreatedUtc     DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantTrialSeatOccupants_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_TenantTrialSeatOccupants2 PRIMARY KEY (TenantId, PrincipalKey),
        CONSTRAINT FK_TenantTrialSeatOccupants_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_TenantTrialSeatOccupants_TenantId2
        ON dbo.TenantTrialSeatOccupants (TenantId);
END;

GO

-- 077: Trial local identity users (email/password; see docs/security/TRIAL_AUTH.md).
IF OBJECT_ID(N'dbo.IdentityUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.IdentityUsers
    (
        Id                            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_IdentityUsers2 PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        NormalizedEmail               NVARCHAR(256)    NOT NULL,
        Email                         NVARCHAR(256)    NOT NULL,
        PasswordHash                  NVARCHAR(500)    NOT NULL,
        SecurityStamp                 NVARCHAR(256)    NOT NULL,
        ConcurrencyStamp              NVARCHAR(256)    NOT NULL,
        EmailConfirmed                BIT              NOT NULL CONSTRAINT DF_IdentityUsers_EmailConfirmed2 DEFAULT (0),
        EmailVerifiedUtc              DATETIMEOFFSET   NULL,
        LockoutEnd                    DATETIMEOFFSET   NULL,
        LockoutEnabled                BIT              NOT NULL CONSTRAINT DF_IdentityUsers_LockoutEnabled2 DEFAULT (1),
        AccessFailedCount             INT              NOT NULL CONSTRAINT DF_IdentityUsers_AccessFailedCount2 DEFAULT (0),
        EmailConfirmationTokenHash    NVARCHAR(128)    NULL,
        EmailConfirmationExpiresUtc   DATETIMEOFFSET   NULL,
        CreatedUtc                    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_IdentityUsers_CreatedUtc2 DEFAULT (SYSUTCDATETIME()),
        LinkedEntraOid                NVARCHAR(128)    NULL,
        LinkedUtc                     DATETIMEOFFSET   NULL
    );

    CREATE UNIQUE INDEX UX_IdentityUsers_NormalizedEmail2 ON dbo.IdentityUsers (NormalizedEmail);
END;

GO

-- 131 parity: add handoff columns on existing IdentityUsers (greenfield CREATE above already includes them).
IF OBJECT_ID(N'dbo.IdentityUsers', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.IdentityUsers', N'LinkedEntraOid') IS NULL
        ALTER TABLE dbo.IdentityUsers ADD LinkedEntraOid NVARCHAR(128) NULL;

    IF COL_LENGTH(N'dbo.IdentityUsers', N'LinkedUtc') IS NULL
        ALTER TABLE dbo.IdentityUsers ADD LinkedUtc DATETIMEOFFSET NULL;
END;

GO

IF OBJECT_ID(N'dbo.TenantWorkspaces', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantWorkspaces
    (
        Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantWorkspaces PRIMARY KEY,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        Name              NVARCHAR(200)    NOT NULL,
        DefaultProjectId  UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc        DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantWorkspaces_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_TenantWorkspaces_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_TenantWorkspaces_TenantId2 ON dbo.TenantWorkspaces (TenantId);
END;

GO

/* 157: Architecture projects (soft-delete; see Migrations/157_Projects_SoftDelete.sql). */
IF OBJECT_ID(N'dbo.Projects', N'U') IS NULL
   AND OBJECT_ID(N'dbo.TenantWorkspaces', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.Projects
    (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Projects PRIMARY KEY,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId  UNIQUEIDENTIFIER NOT NULL,
        Name         NVARCHAR(200)    NOT NULL,
        CreatedUtc   DATETIMEOFFSET   NOT NULL CONSTRAINT DF_Projects_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        IsDeleted    BIT              NOT NULL CONSTRAINT DF_Projects_IsDeleted2 DEFAULT (0),
        CONSTRAINT FK_Projects_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT FK_Projects_TenantWorkspaces2 FOREIGN KEY (WorkspaceId) REFERENCES dbo.TenantWorkspaces (Id)
    );

    CREATE NONCLUSTERED INDEX IX_Projects_TenantId_Workspace_Active2
        ON dbo.Projects (TenantId, WorkspaceId)
        WHERE IsDeleted = 0;

    CREATE UNIQUE NONCLUSTERED INDEX UX_Projects_Workspace_Name_Active2
        ON dbo.Projects (WorkspaceId, Name)
        WHERE IsDeleted = 0;

    INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
    SELECT tw.DefaultProjectId,
           tw.TenantId,
           tw.Id,
           N'default',
           tw.CreatedUtc,
           0
    FROM dbo.TenantWorkspaces tw
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Projects p WHERE p.Id = tw.DefaultProjectId);
END;

GO

/* 158: Projects DeletedUtc for retention hard purge (see Migrations/158_Projects_DeletedUtc.sql). */
IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Projects', N'DeletedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Projects ADD DeletedUtc DATETIMEOFFSET NULL;
END;

GO

IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsageEvents
    (
        Id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_UsageEvents_Id2 DEFAULT NEWSEQUENTIALID(),
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ProjectId      UNIQUEIDENTIFIER NOT NULL,
        Kind           NVARCHAR(64)     NOT NULL,
        Quantity       BIGINT           NOT NULL,
        RecordedUtc    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_UsageEvents_RecordedUtc2 DEFAULT SYSUTCDATETIME(),
        CorrelationId  NVARCHAR(256)    NULL,
        IdempotencyKey NVARCHAR(256)    NULL,
        CONSTRAINT PK_UsageEvents2 PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT CK_UsageEvents_Quantity2 CHECK (Quantity >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_UsageEvents_TenantRecorded2 ON dbo.UsageEvents (TenantId, RecordedUtc);
    CREATE NONCLUSTERED INDEX IX_UsageEvents_KindRecorded2 ON dbo.UsageEvents (Kind, RecordedUtc);
    CREATE UNIQUE NONCLUSTERED INDEX UX_UsageEvents_TenantId_IdempotencyKey2
        ON dbo.UsageEvents (TenantId, IdempotencyKey)
        WHERE IdempotencyKey IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.UsageEvents', N'IdempotencyKey') IS NULL
BEGIN
    ALTER TABLE dbo.UsageEvents ADD IdempotencyKey NVARCHAR(256) NULL;
END;

GO

IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.UsageEvents', N'IdempotencyKey') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_UsageEvents_TenantId_IdempotencyKey2'
          AND object_id = OBJECT_ID(N'dbo.UsageEvents'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_UsageEvents_TenantId_IdempotencyKey2
        ON dbo.UsageEvents (TenantId, IdempotencyKey)
        WHERE IdempotencyKey IS NOT NULL;
END;

GO

/* 076: SentEmails idempotency ledger (transactional email). */
IF OBJECT_ID(N'dbo.SentEmails', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SentEmails
    (
        IdempotencyKey     NVARCHAR(450)    NOT NULL CONSTRAINT PK_SentEmails2 PRIMARY KEY,
        TenantId           UNIQUEIDENTIFIER NOT NULL,
        TemplateId         NVARCHAR(128)    NOT NULL,
        SentUtc            DATETIMEOFFSET   NOT NULL CONSTRAINT DF_SentEmails_SentUtc2 DEFAULT SYSUTCDATETIME(),
        Provider           NVARCHAR(64)     NOT NULL,
        ProviderMessageId  NVARCHAR(256)    NULL
    );

    CREATE NONCLUSTERED INDEX IX_SentEmails_TenantTemplate2
        ON dbo.SentEmails (TenantId, TemplateId);
END;

GO

/* 078: Billing subscriptions + webhook idempotency (see Migrations/078_BillingSubscriptions.sql). */
IF OBJECT_ID(N'dbo.BillingSubscriptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BillingSubscriptions
    (
        TenantId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_BillingSubscriptions2 PRIMARY KEY,
        WorkspaceId            UNIQUEIDENTIFIER NOT NULL,
        ProjectId              UNIQUEIDENTIFIER NOT NULL,
        Provider               NVARCHAR(64)     NOT NULL,
        ProviderSubscriptionId NVARCHAR(256)    NOT NULL CONSTRAINT DF_BillingSubscriptions_ProviderSubscriptionId2 DEFAULT N'',
        Tier                   NVARCHAR(32)     NOT NULL,
        SeatsPurchased         INT              NOT NULL CONSTRAINT DF_BillingSubscriptions_SeatsPurchased2 DEFAULT (0),
        WorkspacesPurchased    INT              NOT NULL CONSTRAINT DF_BillingSubscriptions_WorkspacesPurchased2 DEFAULT (0),
        Status                 NVARCHAR(32)     NOT NULL,
        ActivatedUtc           DATETIMEOFFSET   NULL,
        CanceledUtc            DATETIMEOFFSET   NULL,
        RawWebhookJson         NVARCHAR(MAX)    NULL,
        CreatedUtc             DATETIMEOFFSET   NOT NULL CONSTRAINT DF_BillingSubscriptions_CreatedUtc2 DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc             DATETIMEOFFSET   NOT NULL CONSTRAINT DF_BillingSubscriptions_UpdatedUtc2 DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_BillingSubscriptions_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT CK_BillingSubscriptions_Status2 CHECK (Status IN (N'Pending', N'Active', N'Suspended', N'Canceled'))
    );

    CREATE NONCLUSTERED INDEX IX_BillingSubscriptions_ProviderSession2
        ON dbo.BillingSubscriptions (Provider, ProviderSubscriptionId);
END;

GO

IF OBJECT_ID(N'dbo.BillingWebhookEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BillingWebhookEvents
    (
        EventId      NVARCHAR(128)  NOT NULL CONSTRAINT PK_BillingWebhookEvents2 PRIMARY KEY,
        Provider     NVARCHAR(64)    NOT NULL,
        EventType    NVARCHAR(128)   NOT NULL,
        PayloadJson  NVARCHAR(MAX)   NOT NULL,
        ReceivedUtc  DATETIMEOFFSET  NOT NULL CONSTRAINT DF_BillingWebhookEvents_ReceivedUtc2 DEFAULT (SYSUTCDATETIME()),
        ProcessedUtc DATETIMEOFFSET  NULL,
        ResultStatus NVARCHAR(64)    NULL
    );

    CREATE NONCLUSTERED INDEX IX_BillingWebhookEvents_ProviderReceived2
        ON dbo.BillingWebhookEvents (Provider, ReceivedUtc);
END;

GO

/* ---- DbUp 119 parity: subscription state history + billing procs (see Migrations/119_BillingSubscriptionStateHistory.sql) ---- */

IF OBJECT_ID(N'dbo.BillingSubscriptionStateHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BillingSubscriptionStateHistory
    (
        HistoryId                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_BillingSubscriptionStateHistory_Id2 DEFAULT NEWSEQUENTIALID(),
        TenantId                     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId                 UNIQUEIDENTIFIER NOT NULL,
        ProjectId                    UNIQUEIDENTIFIER NOT NULL,
        RecordedUtc                  DATETIMEOFFSET   NOT NULL CONSTRAINT DF_BillingSubscriptionStateHistory_RecordedUtc2 DEFAULT (SYSDATETIMEOFFSET()),
        ChangeKind                   NVARCHAR(64)     NOT NULL,
        PrevStatus                   NVARCHAR(32)     NULL,
        NewStatus                    NVARCHAR(32)     NULL,
        PrevTier                     NVARCHAR(32)     NULL,
        NewTier                      NVARCHAR(32)     NULL,
        PrevSeatsPurchased           INT              NULL,
        NewSeatsPurchased            INT              NULL,
        PrevWorkspacesPurchased      INT              NULL,
        NewWorkspacesPurchased       INT              NULL,
        PrevProvider                 NVARCHAR(64)     NULL,
        NewProvider                  NVARCHAR(64)     NULL,
        PrevProviderSubscriptionId   NVARCHAR(256)    NULL,
        NewProviderSubscriptionId    NVARCHAR(256)    NULL,
        CONSTRAINT PK_BillingSubscriptionStateHistory2 PRIMARY KEY CLUSTERED (HistoryId),
        CONSTRAINT FK_BillingSubscriptionStateHistory_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_BillingSubscriptionStateHistory_Tenant_RecordedUtc2
        ON dbo.BillingSubscriptionStateHistory (TenantId, RecordedUtc DESC);
END;

GO

/* 079: Trial lifecycle transition log (see Migrations/079_TenantLifecycleTransitions.sql). */
IF OBJECT_ID(N'dbo.TenantLifecycleTransitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantLifecycleTransitions
    (
        TransitionId BIGINT            NOT NULL IDENTITY(1, 1) CONSTRAINT PK_TenantLifecycleTransitions2 PRIMARY KEY,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        FromStatus     NVARCHAR(32)     NOT NULL,
        ToStatus       NVARCHAR(32)     NOT NULL,
        OccurredUtc    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantLifecycleTransitions_OccurredUtc2 DEFAULT (SYSUTCDATETIME()),
        Reason         NVARCHAR(256)    NULL
    );

    CREATE NONCLUSTERED INDEX IX_TenantLifecycleTransitions_Tenant_OccurredUtc2
        ON dbo.TenantLifecycleTransitions (TenantId, OccurredUtc DESC);
END;

GO

/* 080: Enforce one row per (PolicyPackId, Version); see Migrations/080_PolicyPackVersions_UniquePackVersion.sql. */
IF OBJECT_ID(N'dbo.PolicyPackVersions', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.PolicyPackVersions')
         AND name = N'UQ_PolicyPackVersions_PolicyPackId_Version')
BEGIN
    ;WITH Ranked080 AS (
        SELECT
            PolicyPackVersionId,
            ROW_NUMBER() OVER (
                PARTITION BY PolicyPackId, [Version]
                ORDER BY CreatedUtc DESC, PolicyPackVersionId DESC) AS rn
        FROM dbo.PolicyPackVersions
    )
    DELETE v
    FROM dbo.PolicyPackVersions v
    INNER JOIN Ranked080 r ON r.PolicyPackVersionId = v.PolicyPackVersionId
    WHERE r.rn > 1;

    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.PolicyPackVersions')
          AND name = N'IX_PolicyPackVersions_PolicyPackId_Version')
        DROP INDEX IX_PolicyPackVersions_PolicyPackId_Version ON dbo.PolicyPackVersions;

    CREATE UNIQUE NONCLUSTERED INDEX UQ_PolicyPackVersions_PolicyPackId_Version
        ON dbo.PolicyPackVersions (PolicyPackId, [Version]);
END;

GO

/* 081: Trial funnel first manifest timestamp (see Migrations/081_Tenants_TrialFirstManifestCommittedUtc.sql). */
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TrialFirstManifestCommittedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TrialFirstManifestCommittedUtc DATETIMEOFFSET NULL;
END;

GO

/* 082: Tenant customer notification channel toggles (see Migrations/082_TenantNotificationChannelPreferences.sql). */
IF OBJECT_ID(N'dbo.TenantNotificationChannelPreferences', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantNotificationChannelPreferences
    (
        TenantId                                UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantNotificationChannelPreferences2 PRIMARY KEY,
        SchemaVersion                           INT              NOT NULL
            CONSTRAINT DF_TenantNotificationChannelPreferences_SchemaVersion2 DEFAULT 1,
        EmailCustomerNotificationsEnabled       BIT              NOT NULL
            CONSTRAINT DF_TenantNotificationChannelPreferences_Email2 DEFAULT 1,
        TeamsCustomerNotificationsEnabled       BIT              NOT NULL
            CONSTRAINT DF_TenantNotificationChannelPreferences_Teams2 DEFAULT 0,
        OutboundWebhookCustomerNotificationsEnabled BIT          NOT NULL
            CONSTRAINT DF_TenantNotificationChannelPreferences_Webhook2 DEFAULT 0,
        UpdatedUtc                              DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantNotificationChannelPreferences_UpdatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_TenantNotificationChannelPreferences2_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

/* 103: Weekly sponsor digest email preferences (see Migrations/103_TenantExecDigestPreferences.sql). */
IF OBJECT_ID(N'dbo.TenantExecDigestPreferences', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantExecDigestPreferences
    (
        TenantId                    UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantExecDigestPreferences2 PRIMARY KEY,
        SchemaVersion               INT              NOT NULL
            CONSTRAINT DF_TenantExecDigestPreferences_SchemaVersion2 DEFAULT 1,
        EmailEnabled                BIT              NOT NULL
            CONSTRAINT DF_TenantExecDigestPreferences_EmailEnabled2 DEFAULT 0,
        RecipientEmails             NVARCHAR(2000) NULL,
        IanaTimeZoneId              NVARCHAR(128)  NOT NULL
            CONSTRAINT DF_TenantExecDigestPreferences_Tz2 DEFAULT N'UTC',
        DayOfWeek                   TINYINT          NOT NULL
            CONSTRAINT DF_TenantExecDigestPreferences_Dow2 DEFAULT 1,
        HourOfDay                   TINYINT          NOT NULL
            CONSTRAINT DF_TenantExecDigestPreferences_Hour2 DEFAULT 8,
        UpdatedUtc                  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantExecDigestPreferences_UpdatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_TenantExecDigestPreferences_Dow2 CHECK (DayOfWeek BETWEEN 0 AND 6),
        CONSTRAINT CK_TenantExecDigestPreferences_Hour2 CHECK (HourOfDay BETWEEN 0 AND 23),
        CONSTRAINT FK_TenantExecDigestPreferences_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

/* 104: Per-finding thumbs feedback (see Migrations/104_FindingFeedback.sql). */
IF OBJECT_ID(N'dbo.FindingFeedback', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingFeedback
    (
        FeedbackId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FindingFeedback2 PRIMARY KEY,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId  UNIQUEIDENTIFIER NOT NULL,
        ProjectId    UNIQUEIDENTIFIER NOT NULL,
        RunId        UNIQUEIDENTIFIER NOT NULL,
        FindingId    NVARCHAR(32)     NOT NULL,
        Score        SMALLINT         NOT NULL,
        CreatedUtc   DATETIME2(7)     NOT NULL CONSTRAINT DF_FindingFeedback_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_FindingFeedback_Score2 CHECK (Score IN (-1, 1)),
        CONSTRAINT FK_FindingFeedback_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_FindingFeedback_Tenant_CreatedUtc2
        ON dbo.FindingFeedback (TenantId, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_FindingFeedback_Tenant_Run_Finding2
        ON dbo.FindingFeedback (TenantId, RunId, FindingId);
END;

GO

/* 105 + 107: Teams incoming-webhook Key Vault reference per tenant + per-trigger opt-in matrix
   (see Migrations/105_TenantTeamsIncomingWebhookConnections.sql + 107_TenantTeamsIncomingWebhookConnections_EnabledTriggers.sql). */
IF OBJECT_ID(N'dbo.TenantTeamsIncomingWebhookConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantTeamsIncomingWebhookConnections
    (
        TenantId              UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantTeamsIncomingWebhookConnections2 PRIMARY KEY,
        KeyVaultSecretName    NVARCHAR(500)    NOT NULL,
        Label                 NVARCHAR(200)    NULL,
        EnabledTriggersJson   NVARCHAR(MAX)    NOT NULL
            CONSTRAINT DF_TenantTeamsIncomingWebhookConnections_EnabledTriggersJson2
                DEFAULT (N'["com.archlucid.authority.run.completed","com.archlucid.governance.approval.submitted","com.archlucid.alert.fired","com.archlucid.compliance.drift.escalated","com.archlucid.advisory.scan.completed","com.archlucid.seat.reservation.released"]'),
        UpdatedUtc            DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantTeamsIncomingWebhookConnections_UpdatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_TenantTeamsIncomingWebhookConnections_NoUrl2
            CHECK (KeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT CK_TenantTeamsIncomingWebhookConnections_EnabledTriggersJson_IsJson2
            CHECK (ISJSON(EnabledTriggersJson) = 1),
        CONSTRAINT FK_TenantTeamsIncomingWebhookConnections_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

/* 266: Per-tenant Jira / ServiceNow connector references (see Migrations/266_TenantItsmConnectorConnections.sql). */
IF OBJECT_ID(N'dbo.TenantItsmConnectorConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantItsmConnectorConnections
    (
        TenantId                          UNIQUEIDENTIFIER NOT NULL,
        Provider                          NVARCHAR(32)     NOT NULL,
        InstanceBaseUrl                   NVARCHAR(500)    NOT NULL,
        AuthMode                          NVARCHAR(32)     NOT NULL
            CONSTRAINT DF_TenantItsmConnectorConnections_AuthMode2 DEFAULT (N'BasicApiToken'),
        AuthUserName                      NVARCHAR(320)    NULL,
        CredentialKeyVaultSecretName      NVARCHAR(500)    NOT NULL,
        OAuthClientIdKeyVaultSecretName     NVARCHAR(500)    NULL,
        OAuthClientSecretKeyVaultSecretName NVARCHAR(500)    NULL,
        OAuthRefreshTokenKeyVaultSecretName NVARCHAR(500)    NULL,
        InboundWebhookKeyVaultSecretName  NVARCHAR(500)    NULL,
        IsEnabled                         BIT              NOT NULL
            CONSTRAINT DF_TenantItsmConnectorConnections_IsEnabled2 DEFAULT (1),
        Label                             NVARCHAR(200)    NULL,
        UpdatedUtc                        DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantItsmConnectorConnections_UpdatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_TenantItsmConnectorConnections2 PRIMARY KEY (TenantId, Provider),
        CONSTRAINT CK_TenantItsmConnectorConnections_Provider2
            CHECK (Provider IN (N'Jira', N'ServiceNow')),
        CONSTRAINT CK_TenantItsmConnectorConnections_CredentialNoUrl2
            CHECK (CredentialKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT CK_TenantItsmConnectorConnections_InboundNoUrl2
            CHECK (InboundWebhookKeyVaultSecretName IS NULL OR InboundWebhookKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT CK_TenantItsmConnectorConnections_AuthMode2
            CHECK (AuthMode IN (N'BasicApiToken', N'OAuth2ClientCredentials', N'OAuth2RefreshToken')),
        CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientIdNoUrl2
            CHECK (OAuthClientIdKeyVaultSecretName IS NULL OR OAuthClientIdKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientSecretNoUrl2
            CHECK (OAuthClientSecretKeyVaultSecretName IS NULL OR OAuthClientSecretKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT CK_TenantItsmConnectorConnections_OAuthRefreshNoUrl2
            CHECK (OAuthRefreshTokenKeyVaultSecretName IS NULL OR OAuthRefreshTokenKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT FK_TenantItsmConnectorConnections_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

/* 268: OAuth auth-mode columns on per-tenant ITSM connector rows (see Migrations/268_TenantItsmConnectorConnections_OAuthAuthMode.sql; greenfield parity SQL_SCRIPTS.md §5). */
IF COL_LENGTH(N'dbo.TenantItsmConnectorConnections', N'AuthMode') IS NULL
BEGIN
    -- Columns and their CHECK constraints must be added in one ALTER TABLE statement: SQL Server binds
    -- constraint expressions against the table's column list *before* running the batch, so a CHECK added
    -- in a later statement within the same GO batch fails with "Invalid column name" on the sibling column
    -- added just above it.
    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD AuthMode NVARCHAR(32) NOT NULL
                CONSTRAINT DF_TenantItsmConnectorConnections_AuthMode DEFAULT (N'BasicApiToken'),
            OAuthClientIdKeyVaultSecretName NVARCHAR(500) NULL,
            OAuthClientSecretKeyVaultSecretName NVARCHAR(500) NULL,
            OAuthRefreshTokenKeyVaultSecretName NVARCHAR(500) NULL,
            CONSTRAINT CK_TenantItsmConnectorConnections_AuthMode
                CHECK (AuthMode IN (N'BasicApiToken', N'OAuth2ClientCredentials', N'OAuth2RefreshToken')),
            CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientIdNoUrl
                CHECK (OAuthClientIdKeyVaultSecretName IS NULL OR OAuthClientIdKeyVaultSecretName NOT LIKE N'%://%'),
            CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientSecretNoUrl
                CHECK (OAuthClientSecretKeyVaultSecretName IS NULL OR OAuthClientSecretKeyVaultSecretName NOT LIKE N'%://%'),
            CONSTRAINT CK_TenantItsmConnectorConnections_OAuthRefreshNoUrl
                CHECK (OAuthRefreshTokenKeyVaultSecretName IS NULL OR OAuthRefreshTokenKeyVaultSecretName NOT LIKE N'%://%');
END;

GO

/* 083: Tenant health scores + product feedback (see Migrations/083_TenantHealthScores_ProductFeedback.sql). */
IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantHealthScores
    (
        TenantId          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantHealthScores2 PRIMARY KEY,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL,
        EngagementScore   DECIMAL(5, 2)    NOT NULL,
        BreadthScore      DECIMAL(5, 2)    NOT NULL,
        QualityScore      DECIMAL(5, 2)    NOT NULL,
        GovernanceScore   DECIMAL(5, 2)    NOT NULL,
        SupportScore      DECIMAL(5, 2)    NOT NULL,
        CompositeScore    DECIMAL(5, 2)    NOT NULL,
        UpdatedUtc        DATETIME2(7)     NOT NULL CONSTRAINT DF_TenantHealthScores_UpdatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_TenantHealthScores_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantHealthScores', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.TenantHealthScores ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantHealthScores', N'ProjectId') IS NULL
    ALTER TABLE dbo.TenantHealthScores ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.ProductFeedback', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductFeedback
    (
        FeedbackId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ProductFeedback2 PRIMARY KEY,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId  UNIQUEIDENTIFIER NOT NULL,
        ProjectId    UNIQUEIDENTIFIER NOT NULL,
        FindingRef   NVARCHAR(512)    NULL,
        RunId        UNIQUEIDENTIFIER NULL,
        Score        SMALLINT         NOT NULL,
        CommentText  NVARCHAR(2000)   NULL,
        CreatedUtc   DATETIME2(7)     NOT NULL CONSTRAINT DF_ProductFeedback_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_ProductFeedback_Score2 CHECK (Score BETWEEN (-1) AND 1),
        CONSTRAINT FK_ProductFeedback_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_ProductFeedback_Tenant_CreatedUtc2
        ON dbo.ProductFeedback (TenantId, CreatedUtc DESC);
END;

GO

/* ---- DbUp 118 parity: governance workflow tenant/workspace/project scope (see Migrations/118_GovernanceTables_TenantScope.sql) ---- */

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'TenantId') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD TenantId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'ProjectId') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'TenantId') IS NULL
    ALTER TABLE dbo.GovernancePromotionRecords ADD TenantId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.GovernancePromotionRecords ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'ProjectId') IS NULL
    ALTER TABLE dbo.GovernancePromotionRecords ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'TenantId') IS NULL
    ALTER TABLE dbo.GovernanceEnvironmentActivations ADD TenantId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.GovernanceEnvironmentActivations ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'ProjectId') IS NULL
    ALTER TABLE dbo.GovernanceEnvironmentActivations ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'TenantId') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests')
          AND c.name = N'TenantId'
          AND c.is_nullable = 0)
BEGIN
    ALTER TABLE dbo.GovernanceApprovalRequests ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GovernanceApprovalRequests ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GovernanceApprovalRequests ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'TenantId') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords')
          AND c.name = N'TenantId'
          AND c.is_nullable = 0)
BEGIN
    ALTER TABLE dbo.GovernancePromotionRecords ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GovernancePromotionRecords ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GovernancePromotionRecords ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'TenantId') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations')
          AND c.name = N'TenantId'
          AND c.is_nullable = 0)
BEGIN
    ALTER TABLE dbo.GovernanceEnvironmentActivations ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GovernanceEnvironmentActivations ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GovernanceEnvironmentActivations ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;

GO

-- Guard: dbo.Tenants is absent in tenant catalogs (SystemWithPerTenantCatalogs topology).
IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys AS fk
        WHERE fk.parent_object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests')
          AND fk.name = N'FK_GovernanceApprovalRequests_Tenants')
BEGIN
    ALTER TABLE dbo.GovernanceApprovalRequests
        ADD CONSTRAINT FK_GovernanceApprovalRequests_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);
END;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys AS fk
        WHERE fk.parent_object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords')
          AND fk.name = N'FK_GovernancePromotionRecords_Tenants')
BEGIN
    ALTER TABLE dbo.GovernancePromotionRecords
        ADD CONSTRAINT FK_GovernancePromotionRecords_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);
END;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys AS fk
        WHERE fk.parent_object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations')
          AND fk.name = N'FK_GovernanceEnvironmentActivations_Tenants')
BEGIN
    ALTER TABLE dbo.GovernanceEnvironmentActivations
        ADD CONSTRAINT FK_GovernanceEnvironmentActivations_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);
END;

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceApprovalRequests_Scope_RequestedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_Scope_RequestedUtc
        ON dbo.GovernanceApprovalRequests (TenantId, WorkspaceId, ProjectId, RequestedUtc DESC)
        INCLUDE (
            ApprovalRequestId,
            RunId,
            Status,
            ManifestVersion,
            SourceEnvironment,
            TargetEnvironment);
END;

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernancePromotionRecords_Scope_PromotedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernancePromotionRecords_Scope_PromotedUtc
        ON dbo.GovernancePromotionRecords (TenantId, WorkspaceId, ProjectId, PromotedUtc DESC)
        INCLUDE (PromotionRecordId, RunId, ManifestVersion, SourceEnvironment, TargetEnvironment);
END;

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc
        ON dbo.GovernanceEnvironmentActivations (TenantId, WorkspaceId, ProjectId, ActivatedUtc DESC)
        INCLUDE (ActivationId, RunId, Environment, IsActive, ManifestVersion);
END;

GO

/* ---- DbUp 141_00 parity (see Migrations/141_00_ScopeColumns_TenantHealthScores_Governance.sql) ---- */

/*
  141_00: Ensure triple-scope columns exist before 149_TenantHealthScores_BatchRefresh (runs after 148).

  sp_TenantHealthScores_BatchRefresh joins dbo.GovernanceApprovalRequests on WorkspaceId and MERGEs
  dbo.TenantHealthScores with WorkspaceId/ProjectId. Legacy catalogs can have:
  - dbo.TenantHealthScores created with TenantId-only aggregate shape, or
  - governance tables with TenantId populated but WorkspaceId/ProjectId never added (118 only added
    all three when TenantId was absent).

  Batch refresh is migration 149_TenantHealthScores_BatchRefresh.sql (must run after this governance DDL).
*/

/* ---- dbo.TenantHealthScores (083 forward shape) ---- */
IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantHealthScores', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.TenantHealthScores ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantHealthScores', N'ProjectId') IS NULL
    ALTER TABLE dbo.TenantHealthScores ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantHealthScores', N'WorkspaceId') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantHealthScores', N'ProjectId') IS NOT NULL
BEGIN
    DELETE FROM dbo.TenantHealthScores
    WHERE TenantId IS NULL
       OR WorkspaceId IS NULL
       OR ProjectId IS NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.TenantHealthScores')
          AND c.name = N'WorkspaceId'
          AND c.is_nullable = 1)
        AND NOT EXISTS (
            SELECT 1
            FROM dbo.TenantHealthScores AS x
            WHERE x.WorkspaceId IS NULL)

        ALTER TABLE dbo.TenantHealthScores ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.TenantHealthScores')
          AND c.name = N'ProjectId'
          AND c.is_nullable = 1)
        AND NOT EXISTS (
            SELECT 1
            FROM dbo.TenantHealthScores AS x
            WHERE x.ProjectId IS NULL)

        ALTER TABLE dbo.TenantHealthScores ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;

GO

/* ---- Governance workflow tables (118 forward shape) ---- */
IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'TenantId') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD TenantId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'ProjectId') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'TenantId') IS NULL
    ALTER TABLE dbo.GovernancePromotionRecords ADD TenantId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.GovernancePromotionRecords ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'ProjectId') IS NULL
    ALTER TABLE dbo.GovernancePromotionRecords ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'TenantId') IS NULL
    ALTER TABLE dbo.GovernanceEnvironmentActivations ADD TenantId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'WorkspaceId') IS NULL
    ALTER TABLE dbo.GovernanceEnvironmentActivations ADD WorkspaceId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'ProjectId') IS NULL
    ALTER TABLE dbo.GovernanceEnvironmentActivations ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.GovernanceApprovalRequests AS x
        WHERE x.TenantId IS NULL
           OR x.WorkspaceId IS NULL
           OR x.ProjectId IS NULL)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests')
          AND c.name = N'TenantId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernanceApprovalRequests ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests')
          AND c.name = N'WorkspaceId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernanceApprovalRequests ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests')
          AND c.name = N'ProjectId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernanceApprovalRequests ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.GovernancePromotionRecords AS x
        WHERE x.TenantId IS NULL
           OR x.WorkspaceId IS NULL
           OR x.ProjectId IS NULL)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords')
          AND c.name = N'TenantId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernancePromotionRecords ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords')
          AND c.name = N'WorkspaceId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernancePromotionRecords ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords')
          AND c.name = N'ProjectId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernancePromotionRecords ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.GovernanceEnvironmentActivations AS x
        WHERE x.TenantId IS NULL
           OR x.WorkspaceId IS NULL
           OR x.ProjectId IS NULL)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations')
          AND c.name = N'TenantId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernanceEnvironmentActivations ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations')
          AND c.name = N'WorkspaceId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernanceEnvironmentActivations ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations')
          AND c.name = N'ProjectId'
          AND c.is_nullable = 1)

        ALTER TABLE dbo.GovernanceEnvironmentActivations ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceApprovalRequests_Scope_RequestedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
   AND OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_Scope_RequestedUtc
        ON dbo.GovernanceApprovalRequests (TenantId, WorkspaceId, ProjectId, RequestedUtc DESC)
        INCLUDE (
            ApprovalRequestId,
            RunId,
            Status,
            ManifestVersion,
            SourceEnvironment,
            TargetEnvironment);
END;

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernancePromotionRecords_Scope_PromotedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
   AND OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernancePromotionRecords_Scope_PromotedUtc
        ON dbo.GovernancePromotionRecords (TenantId, WorkspaceId, ProjectId, PromotedUtc DESC)
        INCLUDE (PromotionRecordId, RunId, ManifestVersion, SourceEnvironment, TargetEnvironment);
END;

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
   AND OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc
        ON dbo.GovernanceEnvironmentActivations (TenantId, WorkspaceId, ProjectId, ActivatedUtc DESC)
        INCLUDE (ActivationId, RunId, Environment, IsActive, ManifestVersion);
END;

GO

IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_IntegrationEventOutbox_Runs_RunId')
BEGIN
    ALTER TABLE dbo.IntegrationEventOutbox ADD CONSTRAINT FK_IntegrationEventOutbox_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RetrievalIndexingOutbox_Runs_RunId')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.RetrievalIndexingOutbox AS o
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = o.RunId))
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD CONSTRAINT FK_RetrievalIndexingOutbox_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AuthorityPipelineWorkOutbox_Runs_RunId')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AuthorityPipelineWorkOutbox AS o
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = o.RunId))
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD CONSTRAINT FK_AuthorityPipelineWorkOutbox_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_AlertRules_RuleId')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRecords AS ar
        WHERE NOT EXISTS (SELECT 1 FROM dbo.AlertRules AS ru WHERE ru.RuleId = ar.RuleId))
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_AlertRules_RuleId
        FOREIGN KEY (RuleId) REFERENCES dbo.AlertRules (RuleId);
END;

GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_Runs_RunId')
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_Runs_ComparedToRunId')
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_Runs_ComparedToRunId
        FOREIGN KEY (ComparedToRunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_RecommendationRecords_RecommendationId')
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_RecommendationRecords_RecommendationId
        FOREIGN KEY (RecommendationId) REFERENCES dbo.RecommendationRecords (RecommendationId);
END;

GO

IF OBJECT_ID(N'dbo.AlertDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertDeliveryAttempts_AlertRecords_AlertId')
BEGIN
    ALTER TABLE dbo.AlertDeliveryAttempts ADD CONSTRAINT FK_AlertDeliveryAttempts_AlertRecords_AlertId
        FOREIGN KEY (AlertId) REFERENCES dbo.AlertRecords (AlertId);
END;

GO

IF OBJECT_ID(N'dbo.AlertDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertDeliveryAttempts_AlertRoutingSubscriptions_RoutingSubscriptionId')
BEGIN
    ALTER TABLE dbo.AlertDeliveryAttempts ADD CONSTRAINT FK_AlertDeliveryAttempts_AlertRoutingSubscriptions_RoutingSubscriptionId
        FOREIGN KEY (RoutingSubscriptionId) REFERENCES dbo.AlertRoutingSubscriptions (RoutingSubscriptionId);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AuditEvents_Runs_RunId')
BEGIN
    ALTER TABLE dbo.AuditEvents ADD CONSTRAINT FK_AuditEvents_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AuditEvents_GoldenManifests_ManifestId')
BEGIN
    ALTER TABLE dbo.AuditEvents ADD CONSTRAINT FK_AuditEvents_GoldenManifests_ManifestId
        FOREIGN KEY (ManifestId) REFERENCES dbo.GoldenManifests (ManifestId);
END;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RecommendationRecords_Runs_RunId')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.RecommendationRecords AS rr
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = rr.RunId))
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT FK_RecommendationRecords_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RecommendationRecords_Runs_ComparedToRunId')
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT FK_RecommendationRecords_Runs_ComparedToRunId
        FOREIGN KEY (ComparedToRunId) REFERENCES dbo.Runs (RunId);
END;

GO

IF OBJECT_ID(N'dbo.ConversationMessages', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ConversationThreads', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ConversationMessages_ConversationThreads_ThreadId')
BEGIN
    ALTER TABLE dbo.ConversationMessages ADD CONSTRAINT FK_ConversationMessages_ConversationThreads_ThreadId
        FOREIGN KEY (ThreadId) REFERENCES dbo.ConversationThreads (ThreadId);
END;

GO

/* 213: Missing FK constraints — policy pack, advisory, composite alerts, provenance (see Migrations/213_MissingForeignKeys.sql). */
IF OBJECT_ID(N'dbo.PolicyPackVersions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackVersions_PolicyPacks')
BEGIN
    ALTER TABLE dbo.PolicyPackVersions WITH NOCHECK ADD CONSTRAINT FK_PolicyPackVersions_PolicyPacks
        FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);
END;

GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackAssignments_PolicyPacks')
BEGIN
    ALTER TABLE dbo.PolicyPackAssignments WITH NOCHECK ADD CONSTRAINT FK_PolicyPackAssignments_PolicyPacks
        FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);
END;

GO

IF OBJECT_ID(N'dbo.PolicyPackChangeLog', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackChangeLog_PolicyPacks')
BEGIN
    ALTER TABLE dbo.PolicyPackChangeLog WITH NOCHECK ADD CONSTRAINT FK_PolicyPackChangeLog_PolicyPacks
        FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);
END;

GO

IF OBJECT_ID(N'dbo.CompositeAlertRuleConditions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.CompositeAlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CompositeAlertRuleConditions_CompositeAlertRules')
BEGIN
    ALTER TABLE dbo.CompositeAlertRuleConditions WITH NOCHECK ADD CONSTRAINT FK_CompositeAlertRuleConditions_CompositeAlertRules
        FOREIGN KEY (CompositeRuleId) REFERENCES dbo.CompositeAlertRules (CompositeRuleId);
END;

GO

IF OBJECT_ID(N'dbo.AdvisoryScanExecutions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AdvisoryScanSchedules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AdvisoryScanExecutions_Schedules')
BEGIN
    ALTER TABLE dbo.AdvisoryScanExecutions WITH NOCHECK ADD CONSTRAINT FK_AdvisoryScanExecutions_Schedules
        FOREIGN KEY (ScheduleId) REFERENCES dbo.AdvisoryScanSchedules (ScheduleId);
END;

GO

IF OBJECT_ID(N'dbo.DigestDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ArchitectureDigests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DigestDeliveryAttempts_Digests')
BEGIN
    ALTER TABLE dbo.DigestDeliveryAttempts WITH NOCHECK ADD CONSTRAINT FK_DigestDeliveryAttempts_Digests
        FOREIGN KEY (DigestId) REFERENCES dbo.ArchitectureDigests (DigestId);
END;

GO

IF OBJECT_ID(N'dbo.DigestDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.DigestSubscriptions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DigestDeliveryAttempts_Subscriptions')
BEGIN
    ALTER TABLE dbo.DigestDeliveryAttempts WITH NOCHECK ADD CONSTRAINT FK_DigestDeliveryAttempts_Subscriptions
        FOREIGN KEY (SubscriptionId) REFERENCES dbo.DigestSubscriptions (SubscriptionId);
END;

GO

IF OBJECT_ID(N'dbo.ProvenanceSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProvenanceSnapshots_Runs')
BEGIN
    ALTER TABLE dbo.ProvenanceSnapshots WITH NOCHECK ADD CONSTRAINT FK_ProvenanceSnapshots_Runs
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;

GO

/* 094: RowVersionStamp on AlertRecords, RecommendationRecords, BackgroundJobs (see Migrations/094_RowVersion_AlertRecords_RecommendationRecords_BackgroundJobs.sql). */
IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRecords', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.AlertRecords ADD RowVersionStamp ROWVERSION;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RecommendationRecords', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.RecommendationRecords ADD RowVersionStamp ROWVERSION;

GO

IF OBJECT_ID(N'dbo.BackgroundJobs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.BackgroundJobs', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.BackgroundJobs ADD RowVersionStamp ROWVERSION;

GO

/* 095: CHECK status/severity/urgency domains (see Migrations/095_CheckConstraints_StatusDomains_Batch.sql). */
IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_Status')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.PolicyPacks AS p
        WHERE p.Status NOT IN (N'Draft', N'Active', N'Retired'))
BEGIN
    ALTER TABLE dbo.PolicyPacks ADD CONSTRAINT CK_PolicyPacks_Status
        CHECK (Status IN (N'Draft', N'Active', N'Retired'));
END;

GO

IF OBJECT_ID(N'dbo.AlertDeliveryAttempts', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertDeliveryAttempts_Status')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertDeliveryAttempts AS a
        WHERE a.Status NOT IN (N'Started', N'Succeeded', N'Failed'))
BEGIN
    ALTER TABLE dbo.AlertDeliveryAttempts ADD CONSTRAINT CK_AlertDeliveryAttempts_Status
        CHECK (Status IN (N'Started', N'Succeeded', N'Failed'));
END;

GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Severity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRecords AS ar
        WHERE ar.Severity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT CK_AlertRecords_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'High', N'Critical'));
END;

GO

IF OBJECT_ID(N'dbo.AlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRules_Severity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRules AS r
        WHERE r.Severity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.AlertRules ADD CONSTRAINT CK_AlertRules_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'High', N'Critical'));
END;

GO

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRoutingSubscriptions_MinimumSeverity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRoutingSubscriptions AS s
        WHERE s.MinimumSeverity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.AlertRoutingSubscriptions ADD CONSTRAINT CK_AlertRoutingSubscriptions_MinimumSeverity
        CHECK (MinimumSeverity IN (N'Info', N'Warning', N'High', N'Critical'));
END;

GO

IF OBJECT_ID(N'dbo.CompositeAlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CompositeAlertRules_Severity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.CompositeAlertRules AS c
        WHERE c.Severity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.CompositeAlertRules ADD CONSTRAINT CK_CompositeAlertRules_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'High', N'Critical'));
END;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Urgency')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.RecommendationRecords AS rr
        WHERE rr.Urgency NOT IN (N'Critical', N'High', N'Medium', N'Low'))
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_Urgency
        CHECK (Urgency IN (N'Critical', N'High', N'Medium', N'Low'));
END;

GO

/* 116: ISJSON checks on core payload columns (see Migrations/116_CheckJson_CorePayloadColumns.sql). */
IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AuditEvents_DataJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.AuditEvents AS t WHERE ISJSON(t.DataJson) <> 1)
BEGIN
    ALTER TABLE dbo.AuditEvents ADD CONSTRAINT CK_AuditEvents_DataJson_IsJson
        CHECK (ISJSON(DataJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AgentExecutionTraces_TraceJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.AgentExecutionTraces AS t WHERE ISJSON(t.TraceJson) <> 1)
BEGIN
    ALTER TABLE dbo.AgentExecutionTraces ADD CONSTRAINT CK_AgentExecutionTraces_TraceJson_IsJson
        CHECK (ISJSON(TraceJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AgentResults_ResultJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.AgentResults AS t WHERE ISJSON(t.ResultJson) <> 1)
BEGIN
    ALTER TABLE dbo.AgentResults ADD CONSTRAINT CK_AgentResults_ResultJson_IsJson
        CHECK (ISJSON(ResultJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ComparisonRecords_PayloadJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.ComparisonRecords AS t WHERE ISJSON(t.PayloadJson) <> 1)
BEGIN
    ALTER TABLE dbo.ComparisonRecords ADD CONSTRAINT CK_ComparisonRecords_PayloadJson_IsJson
        CHECK (ISJSON(PayloadJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DecisioningTraces_AppliedRuleIdsJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.DecisioningTraces AS t WHERE ISJSON(t.AppliedRuleIdsJson) <> 1)
BEGIN
    ALTER TABLE dbo.DecisioningTraces ADD CONSTRAINT CK_DecisioningTraces_AppliedRuleIdsJson_IsJson
        CHECK (ISJSON(AppliedRuleIdsJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DecisioningTraces_AcceptedFindingIdsJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.DecisioningTraces AS t WHERE ISJSON(t.AcceptedFindingIdsJson) <> 1)
BEGIN
    ALTER TABLE dbo.DecisioningTraces ADD CONSTRAINT CK_DecisioningTraces_AcceptedFindingIdsJson_IsJson
        CHECK (ISJSON(AcceptedFindingIdsJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DecisioningTraces_RejectedFindingIdsJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.DecisioningTraces AS t WHERE ISJSON(t.RejectedFindingIdsJson) <> 1)
BEGIN
    ALTER TABLE dbo.DecisioningTraces ADD CONSTRAINT CK_DecisioningTraces_RejectedFindingIdsJson_IsJson
        CHECK (ISJSON(RejectedFindingIdsJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DecisioningTraces_NotesJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.DecisioningTraces AS t WHERE ISJSON(t.NotesJson) <> 1)
BEGIN
    ALTER TABLE dbo.DecisioningTraces ADD CONSTRAINT CK_DecisioningTraces_NotesJson_IsJson
        CHECK (ISJSON(NotesJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AuthorityPipelineWorkOutbox_PayloadJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.AuthorityPipelineWorkOutbox AS t WHERE ISJSON(t.PayloadJson) <> 1)
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD CONSTRAINT CK_AuthorityPipelineWorkOutbox_PayloadJson_IsJson
        CHECK (ISJSON(PayloadJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_SupportingFindingIdsJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.RecommendationRecords AS t WHERE ISJSON(t.SupportingFindingIdsJson) <> 1)
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_SupportingFindingIdsJson_IsJson
        CHECK (ISJSON(SupportingFindingIdsJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_SupportingDecisionIdsJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.RecommendationRecords AS t WHERE ISJSON(t.SupportingDecisionIdsJson) <> 1)
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_SupportingDecisionIdsJson_IsJson
        CHECK (ISJSON(SupportingDecisionIdsJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_SupportingArtifactIdsJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.RecommendationRecords AS t WHERE ISJSON(t.SupportingArtifactIdsJson) <> 1)
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_SupportingArtifactIdsJson_IsJson
        CHECK (ISJSON(SupportingArtifactIdsJson) = 1);
END;

GO

IF OBJECT_ID(N'dbo.BackgroundJobs', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_BackgroundJobs_WorkUnitJson_IsJson'
         AND parent_object_id = OBJECT_ID(N'dbo.BackgroundJobs'))
BEGIN
    EXEC (N'
        IF NOT EXISTS (SELECT 1 FROM dbo.BackgroundJobs AS t WHERE ISJSON(t.WorkUnitJson) <> 1)
            ALTER TABLE dbo.BackgroundJobs ADD CONSTRAINT CK_BackgroundJobs_WorkUnitJson_IsJson
                CHECK (ISJSON(WorkUnitJson) = 1);
    ');
END;

GO

/* 097: TenantOnboardingState table (DbUp parity; RLS removed by migration 148).

    See Migrations/097_TenantOnboardingState.sql.

 */



IF OBJECT_ID(N'dbo.TenantOnboardingState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantOnboardingState
    (
        TenantId                 UNIQUEIDENTIFIER NOT NULL,
        FirstSessionCompletedUtc DATETIME2(7)     NULL,
        CONSTRAINT PK_TenantOnboardingState PRIMARY KEY CLUSTERED (TenantId),
        CONSTRAINT FK_TenantOnboardingState_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

/* 098: IntegrationEventOutbox dead-letter + pending-with-retry indexes (see Migrations/098_OutboxDeadLetterStuckRowIndexes.sql). */
IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IntegrationEventOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_IntegrationEventOutbox_DeadLetteredUtc'
          AND object_id = OBJECT_ID(N'dbo.IntegrationEventOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_IntegrationEventOutbox_DeadLetteredUtc
        ON dbo.IntegrationEventOutbox (DeadLetteredUtc DESC, EventType)
        INCLUDE (TenantId, WorkspaceId, ProjectId, RetryCount, LastErrorMessage)
        WHERE DeadLetteredUtc IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IntegrationEventOutbox', N'RetryCount') IS NOT NULL
   AND COL_LENGTH(N'dbo.IntegrationEventOutbox', N'NextRetryUtc') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_IntegrationEventOutbox_PendingWithRetries'
          AND object_id = OBJECT_ID(N'dbo.IntegrationEventOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_IntegrationEventOutbox_PendingWithRetries
        ON dbo.IntegrationEventOutbox (NextRetryUtc ASC, CreatedUtc ASC)
        INCLUDE (EventType, TenantId, WorkspaceId, ProjectId, RetryCount, LastErrorMessage)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND RetryCount > 0;
END;

GO

/* 099: Data consistency quarantine (see Migrations/099_DataConsistencyQuarantine.sql). */
IF OBJECT_ID(N'dbo.DataConsistencyQuarantine', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DataConsistencyQuarantine
    (
        QuarantineId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_DataConsistencyQuarantine PRIMARY KEY CLUSTERED,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        SourceTable  NVARCHAR(128)     NOT NULL,
        SourceColumn NVARCHAR(128)     NOT NULL,
        SourceRowKey NVARCHAR(256)     NOT NULL,
        DetectedUtc  DATETIME2(7)      NOT NULL,
        ReasonJson   NVARCHAR(MAX)     NULL,
        CONSTRAINT UQ_DataConsistencyQuarantine_Source UNIQUE (SourceTable, SourceColumn, SourceRowKey)
    );

    CREATE NONCLUSTERED INDEX IX_DataConsistencyQuarantine_TenantId_DetectedUtc
        ON dbo.DataConsistencyQuarantine (TenantId, DetectedUtc DESC);
END;

GO

/* 102/296: Confluence SQL targets + jobs removed — publish path is config + HTTP only (migration 296). */

/* 106: Marketing pricing quote requests (see Migrations/106_MarketingPricingQuoteRequests.sql). */
IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MarketingPricingQuoteRequests
    (
        Id            UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_MarketingPricingQuoteRequests2 PRIMARY KEY CLUSTERED
            CONSTRAINT DF_MarketingPricingQuoteRequests_Id2 DEFAULT NEWSEQUENTIALID(),
        CreatedUtc    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_MarketingPricingQuoteRequests_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        WorkEmail     NVARCHAR(320)    NOT NULL,
        CompanyName   NVARCHAR(200)    NOT NULL,
        TierInterest  NVARCHAR(120)    NOT NULL,
        Message       NVARCHAR(2000)   NOT NULL,
        ClientIpHash  VARBINARY(32)    NULL,
        Status        NVARCHAR(32)     NOT NULL
            CONSTRAINT DF_MarketingPricingQuoteRequests_Status2 DEFAULT N'Open',
        FirstResponseUtc DATETIME2(7)  NULL,
        AssignedOwner NVARCHAR(200)    NULL,
        ClosedUtc     DATETIME2(7)     NULL
    );

    CREATE NONCLUSTERED INDEX IX_MarketingPricingQuoteRequests_CreatedUtc2
        ON dbo.MarketingPricingQuoteRequests (CreatedUtc DESC);
END;

GO

/* ---- DbUp 230 parity: marketing pricing quote follow-up columns (see Migrations/230_MarketingPricingQuoteFollowUp.sql) ---- */
IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequests', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'Status') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD Status NVARCHAR(32) NOT NULL
                CONSTRAINT DF_MarketingPricingQuoteRequests_Status2 DEFAULT N'Open';
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'FirstResponseUtc') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD FirstResponseUtc DATETIME2(7) NULL;
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'AssignedOwner') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD AssignedOwner NVARCHAR(200) NULL;
    END;

    IF COL_LENGTH(N'dbo.MarketingPricingQuoteRequests', N'ClosedUtc') IS NULL
    BEGIN
        ALTER TABLE dbo.MarketingPricingQuoteRequests
            ADD ClosedUtc DATETIME2(7) NULL;
    END;
END;

GO

/* ---- DbUp 231 parity: decisioning trace explainability join ids (see Migrations/231_DecisioningTraces_ExplainabilityJoinIds.sql) ---- */
IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'ContextSnapshotId') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD ContextSnapshotId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'GraphSnapshotId') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD GraphSnapshotId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'FindingsSnapshotId') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD FindingsSnapshotId UNIQUEIDENTIFIER NULL;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'PromptRefsJson') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD PromptRefsJson NVARCHAR(MAX) NULL;

GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'WarningsJson') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD WarningsJson NVARCHAR(MAX) NULL;

GO

/* 167: Marketing early-access / waitlist (see Migrations/167_MarketingEarlyAccessRequests.sql). */
IF OBJECT_ID(N'dbo.MarketingEarlyAccessRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MarketingEarlyAccessRequests
    (
        Id            UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_MarketingEarlyAccessRequests2 PRIMARY KEY CLUSTERED
            CONSTRAINT DF_MarketingEarlyAccessRequests_Id2 DEFAULT NEWSEQUENTIALID(),
        CreatedUtc    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_MarketingEarlyAccessRequests_CreatedUtc2 DEFAULT SYSUTCDATETIME(),
        Email         NVARCHAR(320)    NOT NULL,
        CompanyName   NVARCHAR(200)    NULL,
        Role          NVARCHAR(120)    NULL,
        UtmSource     NVARCHAR(120)    NULL,
        UtmMedium     NVARCHAR(120)    NULL,
        UtmCampaign   NVARCHAR(120)    NULL,
        ClientIpHash  VARBINARY(32)    NULL
    );

    CREATE NONCLUSTERED INDEX IX_MarketingEarlyAccessRequests_CreatedUtc2
        ON dbo.MarketingEarlyAccessRequests (CreatedUtc DESC);
END;

GO

/* 168: Platform audit (see Migrations/168_PlatformAuditEvents.sql). */
IF OBJECT_ID(N'dbo.PlatformAuditEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformAuditEvents
    (
        EventId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PlatformAuditEvents2 PRIMARY KEY,
        OccurredUtc DATETIME2 NOT NULL CONSTRAINT DF_PlatformAuditEvents_OccurredUtc2 DEFAULT SYSUTCDATETIME(),
        EventType NVARCHAR(100) NOT NULL,
        ActorUserId NVARCHAR(200) NOT NULL,
        ActorUserName NVARCHAR(200) NOT NULL,
        SubjectTenantId UNIQUEIDENTIFIER NOT NULL,
        DataJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_PlatformAuditEvents_DataJson2 DEFAULT (N'{}'),
        CorrelationId NVARCHAR(200) NULL,
        INDEX IX_PlatformAuditEvents_SubjectTenantId_OccurredUtc2 NONCLUSTERED (SubjectTenantId, OccurredUtc DESC),
        INDEX IX_PlatformAuditEvents_EventType_OccurredUtc2 NONCLUSTERED (EventType, OccurredUtc DESC)
    );
END;

GO

/* 112: First-tenant onboarding telemetry funnel rows
   (see Migrations/112_FirstTenantFunnelEvents.sql; Improvement 12; pending question 40).
   Schema is created unconditionally; rows appear only when
   Telemetry:FirstTenantFunnel:PerTenantEmission is on (owner-only flag). */
IF OBJECT_ID(N'dbo.FirstTenantFunnelEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FirstTenantFunnelEvents
    (
        EventId      BIGINT           IDENTITY(1, 1) NOT NULL
            CONSTRAINT PK_FirstTenantFunnelEvents2 PRIMARY KEY CLUSTERED,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        EventName    NVARCHAR(64)     NOT NULL,
        OccurredUtc  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_FirstTenantFunnelEvents_OccurredUtc2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_FirstTenantFunnelEvents_EventName2
            CHECK (EventName IN (
                N'signup',
                N'tour_opt_in',
                N'first_run_started',
                N'first_run_committed',
                N'first_finding_viewed',
                N'first_finalization_attempted',
                N'first_export_opened',
                N'thirty_minute_milestone'
            )),
        CONSTRAINT FK_FirstTenantFunnelEvents_Tenants2 FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_FirstTenantFunnelEvents_TenantId_OccurredUtc2
        ON dbo.FirstTenantFunnelEvents (TenantId, OccurredUtc DESC);

    CREATE NONCLUSTERED INDEX IX_FirstTenantFunnelEvents_OccurredUtc2
        ON dbo.FirstTenantFunnelEvents (OccurredUtc DESC);
END;

GO

/* 113: SCIM 2.0 inbound provisioning (see Migrations/113_ScimProvisioning.sql). */
IF COL_LENGTH(N'dbo.Tenants', N'EnterpriseSeatsLimit') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        EnterpriseSeatsLimit INT NULL,
        EnterpriseSeatsUsed INT NOT NULL CONSTRAINT DF_Tenants_EnterpriseSeatsUsed113 DEFAULT (0);
END;

GO

/* 160: First-value report branding (see Migrations/160_TenantFirstValueReportBranding.sql). */
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'BrandingLogoUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        BrandingLogoUrl NVARCHAR(2048) NULL,
        BrandingCompanyName NVARCHAR(256) NULL;
END;

GO

/* 196: Tenant-selected data residency (see Migrations/196_Tenants_DataRegion.sql). */
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'DataRegion') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        DataRegion NVARCHAR(64) NOT NULL CONSTRAINT DF_Tenants_DataRegion DEFAULT N'default';
END;

GO

/* 172: Tenant scheduled erasure quarantine + legal hold (see Migrations/172_Tenants_TenantErasureQuarantine.sql). */
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'OffboardedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        OffboardedUtc           DATETIMEOFFSET NULL,
        ErasureEligibleUtc      DATETIMEOFFSET NULL,
        LegalHoldUntilUtc       DATETIMEOFFSET NULL,
        LegalHoldReason         NVARCHAR(500) NULL,
        LegalHoldSetByUserId    NVARCHAR(256) NULL,
        LegalHoldSetUtc         DATETIMEOFFSET NULL;
END;

GO

/* 222: Explicit tenant erasure request timestamp (see Migrations/222_Tenants_TenantErasureRequestedUtc.sql). */
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TenantErasureRequestedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TenantErasureRequestedUtc DATETIMEOFFSET NULL;
END;

GO

/* 171: Global policy pack catalog hub (see Migrations/171_PolicyPackCatalogEntry.sql). */
IF OBJECT_ID(N'dbo.PolicyPackCatalogEntry', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPackCatalogEntry
    (
        PolicyPackCatalogEntryId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_PolicyPackCatalogEntry PRIMARY KEY,
        DisplayName              NVARCHAR(256) NOT NULL,
        Description              NVARCHAR(2000) NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_Description DEFAULT (N''),
        PackType                 NVARCHAR(100) NOT NULL,
        SnapshotVersion          NVARCHAR(50) NOT NULL,
        SnapshotContentJson      NVARCHAR(MAX) NOT NULL,
        SourcePolicyPackId       UNIQUEIDENTIFIER NOT NULL,
        IsPromoted               BIT NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_IsPromoted DEFAULT (0),
        CreatedUtc               DATETIME2(7) NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc               DATETIME2(7) NOT NULL
            CONSTRAINT DF_PolicyPackCatalogEntry_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        PromotedUtc              DATETIME2(7) NULL,
        DemotedUtc               DATETIME2(7) NULL,
        CONSTRAINT UQ_PolicyPackCatalogEntry_SourcePack UNIQUE (SourcePolicyPackId)
    );

    CREATE NONCLUSTERED INDEX IX_PolicyPackCatalogEntry_IsPromoted_DisplayName
        ON dbo.PolicyPackCatalogEntry (IsPromoted, DisplayName)
        WHERE IsPromoted = 1;
END;

GO

/* 162: Host LLM cost USD/M overrides (see Migrations/162_HostLlmCostEstimationUsdRates.sql). */
IF OBJECT_ID(N'dbo.HostLlmCostEstimationUsdRates', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HostLlmCostEstimationUsdRates
    (
        SingletonKey              NCHAR(1)      NOT NULL,
        InputUsdPerMillionTokens  DECIMAL(18, 8) NOT NULL,
        OutputUsdPerMillionTokens DECIMAL(18, 8) NOT NULL,
        UpdatedUtc                DATETIME2(7)  NOT NULL,
        UpdatedBy                 NVARCHAR(256) NOT NULL,
        CONSTRAINT PK_HostLlmCostEstimationUsdRates PRIMARY KEY (SingletonKey),
        CONSTRAINT CK_HostLlmCostEstimationUsdRates_Singleton CHECK (SingletonKey = N'G'),
        CONSTRAINT CK_HostLlmCostEstimationUsdRates_InputPositive CHECK (InputUsdPerMillionTokens > 0),
        CONSTRAINT CK_HostLlmCostEstimationUsdRates_OutputPositive CHECK (OutputUsdPerMillionTokens > 0)
    );
END;

GO

CREATE OR ALTER PROCEDURE dbo.Archival_PurgeStaleUncommittedRunsBatch
    @CutoffUtc DATETIME2(7),
    @BatchSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @BatchSize < 1 OR @BatchSize > 10000
        THROW 51000, N'Archival_PurgeStaleUncommittedRunsBatch: @BatchSize must be between 1 and 10000.', 1;

    CREATE TABLE #PurgeRuns
    (
        RunId          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL
    );

    INSERT INTO #PurgeRuns (RunId, TenantId, WorkspaceId, ScopeProjectId)
    SELECT TOP (@BatchSize)
           r.RunId,
           r.TenantId,
           r.WorkspaceId,
           r.ScopeProjectId
    FROM dbo.Runs AS r
    WHERE r.CreatedUtc < @CutoffUtc
      AND (   r.LegacyRunStatus IS NULL
           OR r.LegacyRunStatus <> N'Committed')
      AND r.IsDemoWelcomeRun = 0
      AND r.IsPublicShowcase = 0
    ORDER BY r.CreatedUtc ASC;

    IF NOT EXISTS (SELECT 1 FROM #PurgeRuns)
    BEGIN
        SELECT TOP (0)
               RunId,
               TenantId,
               WorkspaceId,
               ScopeProjectId
        FROM dbo.Runs;

        RETURN;
    END;

    BEGIN TRANSACTION;

    UPDATE ae
    SET ae.RunId = NULL
    FROM dbo.AuditEvents AS ae
    WHERE ae.RunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ae.RunId);

    UPDATE ct
    SET ct.RunId = NULL
    FROM dbo.ConversationThreads AS ct
    WHERE ct.RunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ct.RunId);

    UPDATE ct
    SET ct.BaseRunId = NULL
    FROM dbo.ConversationThreads AS ct
    WHERE ct.BaseRunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ct.BaseRunId);

    UPDATE ct
    SET ct.TargetRunId = NULL
    FROM dbo.ConversationThreads AS ct
    WHERE ct.TargetRunId IS NOT NULL
      AND EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ct.TargetRunId);

    DELETE ada
    FROM dbo.AlertDeliveryAttempts AS ada
    WHERE EXISTS (
        SELECT 1
        FROM dbo.AlertRecords AS ar
        WHERE ar.AlertId = ada.AlertId
          AND (   EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ar.RunId)
               OR EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ar.ComparedToRunId)));

    DELETE ar
    FROM dbo.AlertRecords AS ar
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ar.RunId)
       OR EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ar.ComparedToRunId);

    DELETE rr
    FROM dbo.RecommendationRecords AS rr
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = rr.RunId)
       OR EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = rr.ComparedToRunId);

    IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
    BEGIN
        DELETE o
        FROM dbo.IntegrationEventOutbox AS o
        WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = o.RunId);
    END;

    IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
    BEGIN
        DELETE o
        FROM dbo.RetrievalIndexingOutbox AS o
        WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = o.RunId);
    END;

    IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
    BEGIN
        DELETE o
        FROM dbo.AuthorityPipelineWorkOutbox AS o
        WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = o.RunId);
    END;

    IF OBJECT_ID(N'dbo.ArchitectureRunIdempotency', N'U') IS NOT NULL
    BEGIN
        DELETE ari
        FROM dbo.ArchitectureRunIdempotency AS ari
        WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE TRY_CAST(ari.RunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
    BEGIN
        DELETE cri
        FROM dbo.CommitRunIdempotency AS cri
        WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE TRY_CAST(cri.RunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    IF OBJECT_ID(N'dbo.AzureExtractorPackages', N'U') IS NOT NULL
    BEGIN
        DELETE x
        FROM dbo.AzureExtractorPackages AS x
        WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = x.RunId);
    END;

    IF OBJECT_ID(N'dbo.CloudInventoryExtractorPackages', N'U') IS NOT NULL
    BEGIN
        DELETE x
        FROM dbo.CloudInventoryExtractorPackages AS x
        WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = x.RunId);
    END;

    DELETE et
    FROM dbo.AgentExecutionTraces AS et
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE TRY_CAST(et.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    DELETE aru
    FROM dbo.AgentResults AS aru
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE TRY_CAST(aru.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    DELETE t
    FROM dbo.AgentTasks AS t
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE TRY_CAST(t.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    DELETE aep
    FROM dbo.AgentEvidencePackages AS aep
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE TRY_CAST(aep.RunId AS UNIQUEIDENTIFIER) = p.RunId);

    IF OBJECT_ID(N'dbo.ProductLearningImprovementPlanArchitectureRuns', N'U') IS NOT NULL
    BEGIN
        DELETE plr
        FROM dbo.ProductLearningImprovementPlanArchitectureRuns AS plr
        WHERE EXISTS (
            SELECT 1 FROM #PurgeRuns p WHERE TRY_CAST(plr.ArchitectureRunId AS UNIQUEIDENTIFIER) = p.RunId);
    END;

    DELETE ps
    FROM dbo.ProvenanceSnapshots AS ps
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ps.RunId);

    DELETE cr
    FROM dbo.ComparisonRecords AS cr
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = cr.LeftRunId)
       OR EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = cr.RightRunId);

    DELETE ab
    FROM dbo.ArtifactBundles AS ab
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = ab.RunId);

    DELETE gm
    FROM dbo.GoldenManifests AS gm
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = gm.RunId);

    DELETE fs
    FROM dbo.FindingsSnapshots AS fs
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = fs.RunId);

    DELETE gs
    FROM dbo.GraphSnapshots AS gs
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = gs.RunId);

    DELETE cs
    FROM dbo.ContextSnapshots AS cs
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = cs.RunId);

    DELETE dtr
    FROM dbo.DecisioningTraces AS dtr
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = dtr.RunId);

    DECLARE @Removed TABLE
    (
        RunId          UNIQUEIDENTIFIER NOT NULL,
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId    UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId UNIQUEIDENTIFIER NOT NULL
    );

    DELETE r
    OUTPUT deleted.RunId,
           deleted.TenantId,
           deleted.WorkspaceId,
           deleted.ScopeProjectId
    INTO @Removed
    FROM dbo.Runs AS r
    WHERE EXISTS (SELECT 1 FROM #PurgeRuns p WHERE p.RunId = r.RunId);

    COMMIT TRANSACTION;

    SELECT RunId,
           TenantId,
           WorkspaceId,
           ScopeProjectId
    FROM @Removed;
END;

GO

IF OBJECT_ID(N'dbo.ScimTenantTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ScimTenantTokens
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ScimTenantTokens PRIMARY KEY
            CONSTRAINT DF_ScimTenantTokens_Id DEFAULT NEWSEQUENTIALID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        PublicLookupKey NVARCHAR(128) NOT NULL,
        SecretHash VARBINARY(128) NOT NULL,
        CreatedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_ScimTenantTokens_CreatedUtc DEFAULT SYSUTCDATETIME(),
        RevokedUtc DATETIME2(7) NULL,
        CONSTRAINT FK_ScimTenantTokens_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT UQ_ScimTenantTokens_PublicLookupKey UNIQUE (PublicLookupKey)
    );

    CREATE NONCLUSTERED INDEX IX_ScimTenantTokens_TenantId_Active
        ON dbo.ScimTenantTokens (TenantId)
        INCLUDE (SecretHash, CreatedUtc, Id)
        WHERE RevokedUtc IS NULL;
END;

GO

IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ScimUsers
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ScimUsers PRIMARY KEY
            CONSTRAINT DF_ScimUsers_Id DEFAULT NEWSEQUENTIALID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        ExternalId NVARCHAR(256) NOT NULL,
        UserName NVARCHAR(256) NOT NULL,
        DisplayName NVARCHAR(256) NULL,
        Active BIT NOT NULL CONSTRAINT DF_ScimUsers_Active DEFAULT (1),
        ResolvedRole NVARCHAR(64) NULL,
        CreatedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_ScimUsers_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_ScimUsers_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ScimUsers_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT UQ_ScimUsers_TenantId_ExternalId UNIQUE (TenantId, ExternalId)
    );

    CREATE NONCLUSTERED INDEX IX_ScimUsers_TenantId_UserName ON dbo.ScimUsers (TenantId, UserName);
END;

GO

IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProjectRoleAssignments_ScimUsers')
    ALTER TABLE dbo.ProjectRoleAssignments
        ADD CONSTRAINT FK_ProjectRoleAssignments_ScimUsers FOREIGN KEY (UserId) REFERENCES dbo.ScimUsers (Id);

GO

IF OBJECT_ID(N'dbo.ScimGroups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ScimGroups
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ScimGroups PRIMARY KEY
            CONSTRAINT DF_ScimGroups_Id DEFAULT NEWSEQUENTIALID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        ExternalId NVARCHAR(256) NOT NULL,
        DisplayName NVARCHAR(256) NOT NULL,
        CreatedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_ScimGroups_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_ScimGroups_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ScimGroups_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT UQ_ScimGroups_TenantId_ExternalId UNIQUE (TenantId, ExternalId)
    );
END;

GO

IF OBJECT_ID(N'dbo.ScimGroupMembers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ScimGroupMembers
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        GroupId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_ScimGroupMembers_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ScimGroupMembers PRIMARY KEY (GroupId, UserId),
        CONSTRAINT FK_ScimGroupMembers_Groups FOREIGN KEY (GroupId) REFERENCES dbo.ScimGroups (Id),
        CONSTRAINT FK_ScimGroupMembers_Users FOREIGN KEY (UserId) REFERENCES dbo.ScimUsers (Id),
        CONSTRAINT FK_ScimGroupMembers_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_ScimGroupMembers_UserId ON dbo.ScimGroupMembers (UserId, TenantId);
END;

GO

/* DbUp 329 parity: SCIM group member listing by tenant + group. */
IF OBJECT_ID(N'dbo.ScimGroupMembers', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ScimGroupMembers_Tenant_Group'
         AND object_id = OBJECT_ID(N'dbo.ScimGroupMembers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ScimGroupMembers_Tenant_Group
        ON dbo.ScimGroupMembers (TenantId, GroupId)
        INCLUDE (UserId);
END;

GO

/* 133: SCIM ResolvedRoleOrigin + dbo.AdminNotifications (see Migrations/133_ScimResolvedRole_AdminNotifications.sql). */
IF COL_LENGTH(N'dbo.ScimUsers', N'ResolvedRoleOrigin') IS NULL
BEGIN
    ALTER TABLE dbo.ScimUsers ADD
        ResolvedRoleOrigin TINYINT NOT NULL CONSTRAINT DF_ScimUsers_ResolvedRoleOrigin DEFAULT (0),
        CONSTRAINT CK_ScimUsers_ResolvedRoleOrigin_Valid CHECK (ResolvedRoleOrigin IN (0, 1, 2));
END;

GO

/* 140: SCIM directory removal timestamp — DELETE vs PATCH disable (see Migrations/140_ScimUsers_DirectoryRemovedUtc.sql). */
IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ScimUsers', N'DirectoryRemovedUtc') IS NULL
    ALTER TABLE dbo.ScimUsers ADD DirectoryRemovedUtc DATETIME2(7) NULL;

GO

IF OBJECT_ID(N'dbo.AdminNotifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdminNotifications
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AdminNotifications PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        RaisedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_AdminNotifications_RaisedUtc DEFAULT SYSUTCDATETIME(),
        Kind NVARCHAR(96) NOT NULL,
        Summary NVARCHAR(512) NOT NULL,
        DataJson NVARCHAR(MAX) NULL
    );
END;

GO

/* ---- Manifest finalization: one active golden manifest per run + dbo.sp_FinalizeManifest (DbUp 120 + 132 outbox Priority + 272 pre-sealed anchors). ---- */
IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_GoldenManifests_RunId_Active'
          AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_GoldenManifests_RunId_Active
        ON dbo.GoldenManifests (RunId)
        WHERE ArchivedUtc IS NULL;
END;

GO

/* DbUp 302 + 306 parity: typed ContractManifestVersion lookup (replaces JSON_VALUE MetadataJson $.Version).
   Resolves the physical table for the same synonym reason as the column add above. */
DECLARE @manifestVersionIndexTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL THEN N'dbo.SignedReviewRecords'
        WHEN OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL THEN N'dbo.GoldenManifests'
    END;

IF @manifestVersionIndexTable IS NOT NULL
   AND COL_LENGTH(@manifestVersionIndexTable, N'ContractManifestVersion') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_GoldenManifests_Scope_ContractManifestVersion'
          AND object_id = OBJECT_ID(@manifestVersionIndexTable))
BEGIN
    DECLARE @createManifestVersionIndexSql NVARCHAR(MAX) =
        N'CREATE NONCLUSTERED INDEX IX_GoldenManifests_Scope_ContractManifestVersion
              ON ' + @manifestVersionIndexTable + N' (TenantId, WorkspaceId, ProjectId, ContractManifestVersion)
              WHERE ContractManifestVersion IS NOT NULL
                AND ArchivedUtc IS NULL;';

    EXEC sp_executesql @createManifestVersionIndexSql;
END;

GO

IF OBJECT_ID(N'dbo.CorePilotTeamChecklist', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CorePilotTeamChecklist
    (
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId   UNIQUEIDENTIFIER NOT NULL,
        StepIndex   TINYINT          NOT NULL,
        IsCompleted BIT              NOT NULL CONSTRAINT DF_CorePilotTeamChecklist_IsCompleted DEFAULT (0),
        UpdatedUtc  DATETIME2(7)     NOT NULL CONSTRAINT DF_CorePilotTeamChecklist_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedByUserId NVARCHAR(256) NULL,
        CONSTRAINT PK_CorePilotTeamChecklist PRIMARY KEY CLUSTERED (TenantId, WorkspaceId, ProjectId, StepIndex),
        CONSTRAINT CK_CorePilotTeamChecklist_StepIndex CHECK (StepIndex BETWEEN 0 AND 3),
        CONSTRAINT FK_CorePilotTeamChecklist_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_CorePilotTeamChecklist_Scope_Step
        ON dbo.CorePilotTeamChecklist (TenantId, WorkspaceId, ProjectId, StepIndex)
        INCLUDE (IsCompleted, UpdatedUtc);
END;

GO

/*
  DbUp 142: Pilot closeout capture (see Migrations/142_PilotCloseouts.sql).
*/

IF OBJECT_ID(N'dbo.PilotCloseouts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PilotCloseouts
    (
        CloseoutId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PilotCloseouts PRIMARY KEY,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ProjectId             UNIQUEIDENTIFIER NOT NULL,
        RunId                 UNIQUEIDENTIFIER     NULL,
        BaselineHours         DECIMAL(12, 2)       NULL,
        SpeedScore            TINYINT          NOT NULL,
        ManifestPackageScore  TINYINT          NOT NULL,
        TraceabilityScore     TINYINT          NOT NULL,
        Notes                 NVARCHAR(2000)       NULL,
        CreatedUtc            DATETIME2(7)     NOT NULL CONSTRAINT DF_PilotCloseouts_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_PilotCloseouts_Scores CHECK (
            SpeedScore BETWEEN 1 AND 5
            AND ManifestPackageScore BETWEEN 1 AND 5
            AND TraceabilityScore BETWEEN 1 AND 5),
        CONSTRAINT FK_PilotCloseouts_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_PilotCloseouts_Scope_CreatedUtc
        ON dbo.PilotCloseouts (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC);
END;

GO

/* ---- DbUp 143 parity: widen GovernanceEnvironmentActivations.Environment (see Migrations/143_*.sql) ---- */

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns AS c
       INNER JOIN sys.types AS t ON c.user_type_id = t.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations')
         AND c.name = N'Environment'
         AND t.name = N'nvarchar'
         AND c.max_length > 0
         AND c.max_length < 128)
BEGIN
    ALTER TABLE dbo.GovernanceEnvironmentActivations
        ALTER COLUMN Environment NVARCHAR(64) NOT NULL;
END;

GO

/* ---- DbUp 144 parity: ITSM finding correlations (see Migrations/144_ItsmFindingCorrelations.sql) ---- */

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ItsmFindingCorrelations
    (
        CorrelationId    BIGINT           IDENTITY(1, 1) NOT NULL
            CONSTRAINT PK_ItsmFindingCorrelations PRIMARY KEY CLUSTERED,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ProjectId        UNIQUEIDENTIFIER NOT NULL,
        FindingId        NVARCHAR(200)    NOT NULL,
        Provider         NVARCHAR(32)     NOT NULL
            CONSTRAINT CK_ItsmFindingCorrelations_Provider
                CHECK (Provider IN (N'Jira', N'ServiceNow')),
        ExternalKey      NVARCHAR(256)    NOT NULL,
        ExternalSysId    NVARCHAR(64)     NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ItsmFindingCorrelations_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ItsmFindingCorrelations_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT UQ_ItsmFindingCorrelations_Tenant_Provider_ExternalKey UNIQUE (TenantId, Provider, ExternalKey)
    );

    CREATE NONCLUSTERED INDEX IX_ItsmFindingCorrelations_Tenant_Finding
        ON dbo.ItsmFindingCorrelations (TenantId, FindingId);
END;

GO

/* ---- DbUp 258 parity: ITSM correlation FindingRecordId snapshot scoping (see Migrations/258_ItsmFindingCorrelations_FindingRecordId.sql) ---- */
IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ItsmFindingCorrelations', N'FindingRecordId') IS NULL
BEGIN
    ALTER TABLE dbo.ItsmFindingCorrelations
        ADD FindingRecordId UNIQUEIDENTIFIER NULL;
END;

GO

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ItsmFindingCorrelations', N'FindingRecordId') IS NOT NULL
   AND OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_ItsmFindingCorrelations_FindingRecords'
          AND parent_object_id = OBJECT_ID(N'dbo.ItsmFindingCorrelations'))
BEGIN
    ALTER TABLE dbo.ItsmFindingCorrelations
        ADD CONSTRAINT FK_ItsmFindingCorrelations_FindingRecords
            FOREIGN KEY (FindingRecordId) REFERENCES dbo.FindingRecords (FindingRecordId)
            ON DELETE SET NULL;
END;

GO

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = N'UQ_ItsmFindingCorrelations_Provider_ExternalKey'
          AND parent_object_id = OBJECT_ID(N'dbo.ItsmFindingCorrelations'))
    BEGIN
        ALTER TABLE dbo.ItsmFindingCorrelations
            DROP CONSTRAINT UQ_ItsmFindingCorrelations_Provider_ExternalKey;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = N'UQ_ItsmFindingCorrelations_Tenant_Provider_ExternalKey'
          AND parent_object_id = OBJECT_ID(N'dbo.ItsmFindingCorrelations'))
    BEGIN
        ALTER TABLE dbo.ItsmFindingCorrelations
            ADD CONSTRAINT UQ_ItsmFindingCorrelations_Tenant_Provider_ExternalKey
                UNIQUE (TenantId, Provider, ExternalKey);
    END;
END;

GO

/* ---- DbUp 145 parity: tenant ITSM outbound settings (see Migrations/145_TenantItsmOutboundSettings.sql) ---- */

IF OBJECT_ID(N'dbo.TenantItsmOutboundSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantItsmOutboundSettings
    (
        TenantId                      UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantItsmOutboundSettings PRIMARY KEY CLUSTERED,
        JiraProjectKeyOverride       NVARCHAR(32)      NULL,
        JiraSendInfoSeverity          BIT               NOT NULL
            CONSTRAINT DF_TenantItsmOutboundSettings_JiraSendInfoSeverity DEFAULT (0),
        JiraIssueTypeBySeverityJson   NVARCHAR(4000)    NULL,
        ServiceNowAutoCreateCmdbCi    BIT               NOT NULL
            CONSTRAINT DF_TenantItsmOutboundSettings_ServiceNowAutoCreateCmdbCi DEFAULT (0),
        CONSTRAINT FK_TenantItsmOutboundSettings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

/* ---- Analytics / Telemetry ---- */

IF OBJECT_ID(N'dbo.RunTelemetry') IS NULL
BEGIN
    CREATE TABLE dbo.RunTelemetry
    (
        RunId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        RequestDurationMs BIGINT NOT NULL,
        AgentExecutionDurationMs BIGINT NOT NULL,
        ManualReviewDurationMs BIGINT NOT NULL,
        EstimatedHoursSaved DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_RunTelemetry_Runs FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId) ON DELETE CASCADE
    );
END;

GO

/* ---- DbUp 151 parity: LLM monthly tenant USD budget (see Migrations/151_LlmMonthlyTenantBudgetState.sql) ---- */

IF OBJECT_ID(N'dbo.LlmMonthlyTenantBudgetState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmMonthlyTenantBudgetState
    (
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        UtcYear              INT              NOT NULL,
        UtcMonth             INT              NOT NULL,
        SpentUsd             DECIMAL(18, 4)   NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_SpentUsd DEFAULT (0),
        ReservedAssumedUsd   DECIMAL(18, 4)   NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_ReservedAssumedUsd DEFAULT (0),
        PurchasedCapBumpUsd  DECIMAL(18, 6)   NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_PurchasedCapBumpUsd DEFAULT (0),
        WarnedApproaching    BIT              NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_Warned DEFAULT (0),
        LastUpdatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_LlmMonthlyTenantBudgetState_Lku DEFAULT SYSUTCDATETIME(),
        RowVersion           ROWVERSION       NOT NULL,
        CONSTRAINT PK_LlmMonthlyTenantBudgetState PRIMARY KEY CLUSTERED (TenantId, UtcYear, UtcMonth),
        CONSTRAINT CK_LlmMonthlyTenantBudgetState_Month CHECK (UtcMonth >= 1 AND UtcMonth <= 12),
        CONSTRAINT CK_LlmMonthlyTenantBudgetState_Year CHECK (UtcYear >= 2000 AND UtcYear <= 2100),
        CONSTRAINT CK_LlmMonthlyTenantBudgetState_SpentNonNegative CHECK (SpentUsd >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_LlmMonthlyTenantBudgetState_LastUpdatedUtc
        ON dbo.LlmMonthlyTenantBudgetState (LastUpdatedUtc DESC);
END;

GO

/* ---- DbUp 152 parity: LLM daily tenant token window (see Migrations/152_LlmDailyTenantTokenWindowState.sql) ---- */

IF OBJECT_ID(N'dbo.LlmDailyTenantTokenWindowState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmDailyTenantTokenWindowState
    (
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        UtcDay                 DATE             NOT NULL,
        TotalTokens            BIGINT           NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_Tokens DEFAULT (0),
        ReservedAssumedTokens  BIGINT           NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_ReservedAssumedTokens DEFAULT (0),
        WarnedApproaching      BIT              NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_Warned DEFAULT (0),
        LastUpdatedUtc         DATETIME2(7)     NOT NULL
            CONSTRAINT DF_LlmDailyTenantTokenWindowState_Lku DEFAULT SYSUTCDATETIME(),
        RowVersion             ROWVERSION       NOT NULL,
        CONSTRAINT PK_LlmDailyTenantTokenWindowState PRIMARY KEY CLUSTERED (TenantId, UtcDay),
        CONSTRAINT CK_LlmDailyTenantTokenWindowState_TokensNonNegative CHECK (TotalTokens >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_LlmDailyTenantTokenWindowState_LastUpdatedUtc
        ON dbo.LlmDailyTenantTokenWindowState (LastUpdatedUtc DESC);
END;

GO

/* ---- DbUp 241 parity: LLM judge daily tenant token window (see Migrations/241_LlmJudgeDailyTenantTokenWindowState.sql) ---- */

IF OBJECT_ID(N'dbo.LlmJudgeDailyTenantTokenWindowState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmJudgeDailyTenantTokenWindowState
    (
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        UtcDay                 DATE             NOT NULL,
        TotalTokens            BIGINT           NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_Tokens DEFAULT (0),
        ReservedAssumedTokens  BIGINT           NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_ReservedAssumedTokens DEFAULT (0),
        WarnedApproaching      BIT              NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_Warned DEFAULT (0),
        LastUpdatedUtc         DATETIME2(7)     NOT NULL
            CONSTRAINT DF_LlmJudgeDailyTenantTokenWindowState_Lku DEFAULT SYSUTCDATETIME(),
        RowVersion             ROWVERSION       NOT NULL,
        CONSTRAINT PK_LlmJudgeDailyTenantTokenWindowState PRIMARY KEY CLUSTERED (TenantId, UtcDay),
        CONSTRAINT CK_LlmJudgeDailyTenantTokenWindowState_TokensNonNegative CHECK (TotalTokens >= 0)
    );

    CREATE NONCLUSTERED INDEX IX_LlmJudgeDailyTenantTokenWindowState_LastUpdatedUtc
        ON dbo.LlmJudgeDailyTenantTokenWindowState (LastUpdatedUtc DESC);
END;

GO

/* ---- DbUp 159 parity: commit-run idempotency + project role assignments (see Migrations/159_CommitRunIdempotency_ProjectRoleAssignments.sql) ---- */

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NULL
   AND OBJECT_ID(N'dbo.CommitRunIdempotency') IS NULL
   AND OBJECT_ID(N'dbo.FinalizeReviewIdempotency', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CommitRunIdempotency
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        RunId                   NVARCHAR(64)       NOT NULL,
        IdempotencyKeyHash      VARBINARY(32)      NOT NULL,
        RequestFingerprint      VARBINARY(32)      NOT NULL,
        CreatedUtc               DATETIME2(7)      NOT NULL
            CONSTRAINT DF_CommitRunIdempotency_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_CommitRunIdempotency PRIMARY KEY CLUSTERED (TenantId, WorkspaceId, ProjectId, RunId, IdempotencyKeyHash),
        -- FK_CommitRunIdempotency_Tenants omitted here; added via guarded ALTER TABLE after dbo.Tenants.
        CONSTRAINT CK_CommitRunIdempotency_RunIdLen CHECK (LEN(RunId) > 0)
    );

    CREATE NONCLUSTERED INDEX IX_CommitRunIdempotency_Scope_Key
        ON dbo.CommitRunIdempotency (TenantId, WorkspaceId, ProjectId, IdempotencyKeyHash);
END;

GO

IF OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectRoleAssignments
    (
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ProjectId       UNIQUEIDENTIFIER NOT NULL,
        UserId          UNIQUEIDENTIFIER NOT NULL,
        Role            NVARCHAR(32)     NOT NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL CONSTRAINT DF_ProjectRoleAssignments_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ProjectRoleAssignments PRIMARY KEY CLUSTERED (TenantId, ProjectId, UserId),
        -- FK_ProjectRoleAssignments_Tenants omitted here; added via guarded ALTER TABLE after dbo.Tenants.
        CONSTRAINT FK_ProjectRoleAssignments_ScimUsers FOREIGN KEY (UserId) REFERENCES dbo.ScimUsers (Id),
        CONSTRAINT CK_ProjectRoleAssignments_Role CHECK (Role IN (N'Reader', N'Operator', N'ProjectAdmin'))
    );

    CREATE NONCLUSTERED INDEX IX_ProjectRoleAssignments_User_Scope
        ON dbo.ProjectRoleAssignments (TenantId, WorkspaceId, ProjectId, UserId)
        INCLUDE (Role);
END;

GO

/* 169: Authority pipeline tenant execution leases (see Migrations/169_AuthorityPipelineTenantExecutionLease.sql). */
IF OBJECT_ID(N'dbo.AuthorityPipelineTenantExecutionLease', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthorityPipelineTenantExecutionLease
    (
        RunId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuthorityPipelineTenantExecutionLease2 PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        AcquiredUtc DATETIME2 NOT NULL CONSTRAINT DF_AuthorityPipelineTenantExecutionLease_AcquiredUtc2 DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_AuthorityPipelineTenantExecutionLease_TenantId_AcquiredUtc2
        ON dbo.AuthorityPipelineTenantExecutionLease (TenantId, AcquiredUtc);
END;

GO

/* ---- DbUp 173 parity: per-tenant key/value settings (see Migrations/173_TenantSettings.sql) ---- */
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

/* ---- DbUp 183 parity: per-tenant SSO identity provider configuration (see Migrations/183_TenantIdentityProviderConfigurations.sql) ---- */
IF OBJECT_ID(N'dbo.TenantIdentityProviderConfigurations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantIdentityProviderConfigurations
    (
        TenantId            UNIQUEIDENTIFIER  NOT NULL
            CONSTRAINT PK_TenantIdentityProviderConfigurations PRIMARY KEY,
        Protocol            NVARCHAR(16)      NOT NULL,
        IssuerUri           NVARCHAR(2048)    NOT NULL,
        MetadataXml         NVARCHAR(MAX)     NULL,
        ClaimMappingJson    NVARCHAR(MAX)     NOT NULL,
        KeyVaultSecretName  NVARCHAR(256)     NULL,
        UpdatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantIdentityProviderConfigurations_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId    NVARCHAR(256)     NOT NULL,
        IsActive            BIT               NOT NULL
            CONSTRAINT DF_TenantIdentityProviderConfigurations_IsActive DEFAULT (0),
        CONSTRAINT CK_TenantIdentityProviderConfigurations_Protocol
            CHECK (Protocol IN (N'oidc', N'saml')),
        CONSTRAINT CK_TenantIdentityProviderConfigurations_ClaimMappingJson
            CHECK (ISJSON(ClaimMappingJson) = 1),
        CONSTRAINT FK_TenantIdentityProviderConfigurations_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantIdentityProviderConfigurations_IsActive
        ON dbo.TenantIdentityProviderConfigurations (IsActive)
        INCLUDE (TenantId, Protocol, UpdatedUtc);
END;

GO

/* ---- DbUp 189 parity: hosted Azure extractor configuration (see Migrations/189_TenantHostedExtractorConfigurations.sql) ---- */
IF OBJECT_ID(N'dbo.TenantHostedExtractorConfigurations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantHostedExtractorConfigurations
    (
        TenantId            UNIQUEIDENTIFIER  NOT NULL,
        SubscriptionId      NVARCHAR(64)      NOT NULL,
        CustomerTenantId    NVARCHAR(64)      NOT NULL,
        CustomerAppId       NVARCHAR(64)      NOT NULL,
        IncludeCost         BIT               NOT NULL
            CONSTRAINT DF_TenantHostedExtractorConfigurations_IncludeCost DEFAULT (0),
        UpdatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantHostedExtractorConfigurations_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId    NVARCHAR(256)     NOT NULL,
        CONSTRAINT PK_TenantHostedExtractorConfigurations PRIMARY KEY (TenantId, SubscriptionId),
        CONSTRAINT FK_TenantHostedExtractorConfigurations_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantHostedExtractorConfigurations_TenantId
        ON dbo.TenantHostedExtractorConfigurations (TenantId)
        INCLUDE (SubscriptionId, CustomerAppId, UpdatedUtc);
END;

GO

/* ---- DbUp 263 parity: hosted AWS extractor connections (see Migrations/263_TenantAwsConnectionRecords.sql) ---- */
IF OBJECT_ID(N'dbo.TenantAwsConnectionRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantAwsConnectionRecords
    (
        ConnectionId        UNIQUEIDENTIFIER  NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_ConnectionId DEFAULT (NEWSEQUENTIALID()),
        TenantId            UNIQUEIDENTIFIER  NOT NULL,
        AccountId           NVARCHAR(32)      NOT NULL,
        Region              NVARCHAR(32)      NOT NULL,
        RoleArn             NVARCHAR(256)     NOT NULL,
        Status              NVARCHAR(32)      NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_Status DEFAULT (N'Connected'),
        LastPolledUtc       DATETIMEOFFSET(7) NULL,
        CreatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId    NVARCHAR(256)     NOT NULL,
        CONSTRAINT PK_TenantAwsConnectionRecords PRIMARY KEY (ConnectionId),
        CONSTRAINT UQ_TenantAwsConnectionRecords_TenantAccount UNIQUE (TenantId, AccountId),
        CONSTRAINT FK_TenantAwsConnectionRecords_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantAwsConnectionRecords_TenantId
        ON dbo.TenantAwsConnectionRecords (TenantId)
        INCLUDE (AccountId, Region, Status, LastPolledUtc, UpdatedUtc);
END;

GO

/* ---- DbUp 264 parity: hosted GCP extractor connections (see Migrations/264_TenantGcpConnectionRecords.sql) ---- */
IF OBJECT_ID(N'dbo.TenantGcpConnectionRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantGcpConnectionRecords
    (
        ConnectionId                    UNIQUEIDENTIFIER  NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_ConnectionId DEFAULT (NEWSEQUENTIALID()),
        TenantId                        UNIQUEIDENTIFIER  NOT NULL,
        ProjectId                       NVARCHAR(64)      NOT NULL,
        WorkloadIdentityPoolProvider    NVARCHAR(512)     NOT NULL,
        ServiceAccountEmail             NVARCHAR(256)     NOT NULL,
        Status                          NVARCHAR(32)      NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_Status DEFAULT (N'Connected'),
        LastPolledUtc                   DATETIMEOFFSET(7) NULL,
        CreatedUtc                      DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc                      DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId                NVARCHAR(256)     NOT NULL,
        CONSTRAINT PK_TenantGcpConnectionRecords PRIMARY KEY (ConnectionId),
        CONSTRAINT UQ_TenantGcpConnectionRecords_TenantProject UNIQUE (TenantId, ProjectId),
        CONSTRAINT FK_TenantGcpConnectionRecords_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantGcpConnectionRecords_TenantId
        ON dbo.TenantGcpConnectionRecords (TenantId)
        INCLUDE (ProjectId, Status, LastPolledUtc, UpdatedUtc);
END;

GO

/* ---- DbUp 191 parity: AuditEvents correlation/run indexes (see Migrations/191_AuditEvents_CorrelationRunId_Indexes.sql) ---- */
IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_CorrelationId'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_CorrelationId
        ON dbo.AuditEvents (CorrelationId)
        WHERE CorrelationId IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_RunId_OccurredUtc'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_RunId_OccurredUtc
        ON dbo.AuditEvents (RunId, OccurredUtc DESC)
        WHERE RunId IS NOT NULL;
END;

GO

/* ---- DbUp 198 parity: HTTP idempotency replay store (see Migrations/198_IdempotencyRecords.sql) ---- */
IF OBJECT_ID('dbo.IdempotencyRecords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.IdempotencyRecords
    (
        IdempotencyKey NVARCHAR(128) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        StatusCode INT NOT NULL,
        ResponseBody NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CONSTRAINT PK_IdempotencyRecords PRIMARY KEY (TenantId, IdempotencyKey)
    );
END

GO

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RetrievalGroundingTrace
    (
        TraceId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RetrievalGroundingTrace PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        AgentName NVARCHAR(64) NOT NULL,
        RetrievedChunkIdsJson NVARCHAR(MAX) NOT NULL,
        TokensIn INT NULL,
        TokensOut INT NULL,
        CitationCoverage DECIMAL(5, 4) NOT NULL,
        QueryText NVARCHAR(MAX) NULL,
        TopK INT NULL,
        CorpusKind NVARCHAR(64) NULL,
        ScoresJson NVARCHAR(MAX) NULL,
        DocumentIdsJson NVARCHAR(MAX) NULL,
        AgentExecutionTraceId NVARCHAR(64) NULL,
        IterativeRetrievalRounds INT NULL,
        IterativeCritiqueDecisionsJson NVARCHAR(4000) NULL,
        CreatedUtc DATETIME2 NOT NULL CONSTRAINT DF_RetrievalGroundingTrace_CreatedUtc DEFAULT (SYSUTCDATETIME())
    );

    CREATE NONCLUSTERED INDEX IX_RetrievalGroundingTrace_RunId
        ON dbo.RetrievalGroundingTrace (RunId, CreatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'IterativeRetrievalRounds') IS NULL
    ALTER TABLE dbo.RetrievalGroundingTrace ADD IterativeRetrievalRounds INT NULL;

GO

IF OBJECT_ID(N'dbo.RetrievalGroundingTrace', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.RetrievalGroundingTrace', N'IterativeCritiqueDecisionsJson') IS NULL
    ALTER TABLE dbo.RetrievalGroundingTrace ADD IterativeCritiqueDecisionsJson NVARCHAR(4000) NULL;

GO

/* ---- DbUp 221 parity: LLM prepaid wallet (see Migrations/221_LlmTenantWallet.sql) ---- */

IF OBJECT_ID(N'dbo.LlmTenantWalletState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmTenantWalletState
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        BalanceUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_BalanceUsd DEFAULT (0),
        AutoReplenishEnabled BIT NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_AutoReplenishEnabled DEFAULT (0),
        RefillIncrementUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_RefillIncrementUsd DEFAULT (50.00),
        RefillTriggerThresholdUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_RefillTriggerThresholdUsd DEFAULT (10.00),
        MonthlyCapUsd DECIMAL(10, 2) NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_MonthlyCapUsd DEFAULT (0),
        AutoRefillsThisUtcMonthCount INT NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_AutoRefillsThisUtcMonthCount DEFAULT (0),
        AutoRefillsThisUtcMonthYearMonth INT NOT NULL
            CONSTRAINT DF_LlmTenantWalletState_AutoRefillsThisUtcMonthYearMonth DEFAULT (0),
        LastRefillUtc DATETIME2 NULL,
        StripeCustomerId NVARCHAR(255) NULL,
        StripePaymentMethodId NVARCHAR(255) NULL,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT PK_LlmTenantWalletState PRIMARY KEY CLUSTERED (TenantId)
    );
END;

GO

IF OBJECT_ID(N'dbo.LlmTenantWalletLedger', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LlmTenantWalletLedger
    (
        LedgerId BIGINT IDENTITY(1, 1) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        EntryType NVARCHAR(32) NOT NULL,
        AmountUsd DECIMAL(10, 2) NOT NULL,
        BalanceAfterUsd DECIMAL(10, 2) NOT NULL,
        StripePaymentIntentId NVARCHAR(255) NULL,
        CorrelationId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL
            CONSTRAINT DF_LlmTenantWalletLedger_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_LlmTenantWalletLedger PRIMARY KEY CLUSTERED (LedgerId),
        CONSTRAINT FK_LlmTenantWalletLedger_State FOREIGN KEY (TenantId)
            REFERENCES dbo.LlmTenantWalletState (TenantId)
    );

    CREATE NONCLUSTERED INDEX IX_LlmTenantWalletLedger_TenantId_CreatedUtc
        ON dbo.LlmTenantWalletLedger (TenantId, CreatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.StripeWebhookIdempotency', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StripeWebhookIdempotency
    (
        StripeEventId NVARCHAR(255) NOT NULL,
        EventType NVARCHAR(128) NOT NULL,
        ProcessedUtc DATETIME2 NOT NULL
            CONSTRAINT DF_StripeWebhookIdempotency_ProcessedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_StripeWebhookIdempotency PRIMARY KEY CLUSTERED (StripeEventId)
    );
END;

GO

/* ---- DbUp 225 parity: finding disposition columns + risk exceptions (TB-058 / TB-059) ---- */

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'Disposition') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD Disposition NVARCHAR(64) NULL;

GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'RevisitDueUtc') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD RevisitDueUtc DATETIME2 NULL;

GO

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'EvidenceRequestText') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD EvidenceRequestText NVARCHAR(MAX) NULL;

GO

IF OBJECT_ID(N'dbo.RiskExceptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RiskExceptions
    (
        RiskExceptionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RiskExceptions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        FindingId NVARCHAR(200) NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        ManifestId UNIQUEIDENTIFIER NULL,
        OwnerUserId NVARCHAR(256) NOT NULL,
        Rationale NVARCHAR(MAX) NOT NULL,
        EvidenceRef NVARCHAR(500) NULL,
        ExpiresAtUtc DATETIME2 NOT NULL,
        Status NVARCHAR(32) NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NOT NULL,
        RevokedAtUtc DATETIME2 NULL,
        RevokedByUserId NVARCHAR(256) NULL
    );

    CREATE NONCLUSTERED INDEX IX_RiskExceptions_Tenant_Finding
        ON dbo.RiskExceptions (TenantId, FindingId, Status);

    CREATE NONCLUSTERED INDEX IX_RiskExceptions_Tenant_Expires
        ON dbo.RiskExceptions (TenantId, ExpiresAtUtc, Status);
END;

GO

/* ---- DbUp 230 parity: architecture review recurrence schedules (TB-059–062) ---- */

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureReviewRecurrenceSchedules
    (
        ScheduleId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ArchitectureReviewRecurrenceSchedules PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SourceRunId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(300) NOT NULL,
        CronExpression NVARCHAR(100) NOT NULL,
        IsEnabled BIT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NOT NULL,
        LastTriggeredUtc DATETIME2 NULL,
        LastTriggeredRunId UNIQUEIDENTIFIER NULL,
        NextRunUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureReviewRecurrenceSchedules_Scope_Enabled_NextRun
        ON dbo.ArchitectureReviewRecurrenceSchedules (TenantId, WorkspaceId, ProjectId, IsEnabled, NextRunUtc);

    CREATE NONCLUSTERED INDEX IX_ArchitectureReviewRecurrenceSchedules_SourceRun
        ON dbo.ArchitectureReviewRecurrenceSchedules (TenantId, SourceRunId);
END;

GO

/* ---- DbUp 243 parity: recurrence schedule failure health (TB-262) ---- */

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'LastRunStatus') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules ADD
        LastRunStatus NVARCHAR(32) NOT NULL
            CONSTRAINT DF_ArchitectureReviewRecurrenceSchedules_LastRunStatus DEFAULT (N'never'),
        LastErrorMessage NVARCHAR(2048) NULL,
        ConsecutiveFailureCount INT NOT NULL
            CONSTRAINT DF_ArchitectureReviewRecurrenceSchedules_ConsecutiveFailureCount DEFAULT (0);
END;

GO

/* ---- DbUp 232 parity: agent tool invocation ledger (see Migrations/232_AgentToolInvocationRecords.sql) ---- */

IF OBJECT_ID(N'dbo.AgentToolInvocationRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentToolInvocationRecords
    (
        InvocationRecordId BIGINT           IDENTITY(1, 1) NOT NULL
            CONSTRAINT PK_AgentToolInvocationRecords PRIMARY KEY CLUSTERED,
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        RunId                UNIQUEIDENTIFIER NOT NULL,
        TraceId              NVARCHAR(64)     NOT NULL,
        TaskId               NVARCHAR(64)     NOT NULL,
        SortOrder            INT              NOT NULL,
        ToolName             NVARCHAR(128)    NOT NULL,
        ArgsPreview          NVARCHAR(500)    NOT NULL,
        ResponseSummary      NVARCHAR(500)    NULL,
        Outcome              NVARCHAR(32)     NOT NULL,
        DurationMs           INT              NULL,
        BlobUploadFailed     BIT              NOT NULL
            CONSTRAINT DF_AgentToolInvocationRecords_BlobUploadFailed DEFAULT (0),
        CompletenessNote     NVARCHAR(500)    NULL,
        InvokedAtUtc         DATETIME2(7)     NOT NULL,
        CONSTRAINT UQ_AgentToolInvocationRecords_Trace_Sort UNIQUE (TenantId, TraceId, SortOrder)
    );

    CREATE NONCLUSTERED INDEX IX_AgentToolInvocationRecords_Tenant_Run_Sort
        ON dbo.AgentToolInvocationRecords (TenantId, RunId, SortOrder, InvokedAtUtc);
END;

GO

/* ---- DbUp 240 parity: authority pipeline stage outcomes (see Migrations/240_RunStageOutcomes.sql) ---- */

IF OBJECT_ID(N'dbo.RunStageOutcomes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RunStageOutcomes
    (
        RunId          UNIQUEIDENTIFIER NOT NULL,
        StageName      NVARCHAR(64)     NOT NULL,
        StartedUtc     DATETIME2(7)     NOT NULL,
        CompletedUtc   DATETIME2(7)     NULL,
        OutcomeStatus  NVARCHAR(32)     NOT NULL
            CONSTRAINT DF_RunStageOutcomes_OutcomeStatus DEFAULT (N'running'),
        CONSTRAINT PK_RunStageOutcomes PRIMARY KEY (RunId, StageName),
        CONSTRAINT CK_RunStageOutcomes_OutcomeStatus CHECK (
            OutcomeStatus IN (N'running', N'succeeded', N'failed', N'skipped')),
        CONSTRAINT FK_RunStageOutcomes_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );

    CREATE NONCLUSTERED INDEX IX_RunStageOutcomes_RunId
        ON dbo.RunStageOutcomes (RunId)
        INCLUDE (StageName, StartedUtc, CompletedUtc, OutcomeStatus);
END;

GO

/* ---- DbUp 233 parity: run operator governance disposition (see Migrations/233_Runs_OperatorGovernanceDisposition.sql) ---- */

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecision') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecision NVARCHAR(32) NULL;

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionRationale') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecisionRationale NVARCHAR(2000) NULL;

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionUtc') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecisionUtc DATETIME2(7) NULL;

GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionByUserId') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecisionByUserId NVARCHAR(256) NULL;

GO

/* ---- DbUp 234 parity: backfill checkpoint + failure quarantine (see Migrations/234_BackfillCheckpoints_BackfillFailures.sql) ---- */

IF OBJECT_ID(N'dbo.BackfillCheckpoints', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BackfillCheckpoints
    (
        Stage                    NVARCHAR(64)      NOT NULL
            CONSTRAINT PK_BackfillCheckpoints PRIMARY KEY,
        LastProcessedCreatedUtc  DATETIME2(7)      NOT NULL,
        LastProcessedKey         NVARCHAR(128)     NOT NULL,
        UpdatedUtc               DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_BackfillCheckpoints_UpdatedUtc DEFAULT SYSUTCDATETIME()
    );
END;

GO

IF OBJECT_ID(N'dbo.BackfillFailures', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BackfillFailures
    (
        Stage                    NVARCHAR(64)      NOT NULL,
        EntityKey                NVARCHAR(128)     NOT NULL,
        FailureCount             INT               NOT NULL,
        LastError                NVARCHAR(MAX)     NOT NULL,
        LastAttemptUtc           DATETIMEOFFSET(7) NOT NULL,
        SkippedAfterMaxRetries   BIT               NOT NULL
            CONSTRAINT DF_BackfillFailures_SkippedAfterMaxRetries DEFAULT (0),
        CONSTRAINT PK_BackfillFailures PRIMARY KEY (Stage, EntityKey)
    );
END;

GO

/* TB-303 / Migration 247: commit-sealed evidence immutability + post-commit agent-result enrichments. */
IF OBJECT_ID(N'dbo.AgentResultEnrichments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentResultEnrichments
    (
        ResultId                      NVARCHAR(64)  NOT NULL PRIMARY KEY,
        CalibratedConfidence          FLOAT         NULL,
        EnrichedResultJson            NVARCHAR(MAX) NULL,
        EvidenceProposalPromotedUtc   DATETIME2     NULL,
        UpdatedUtc                    DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentResultEnrichments_Result
            FOREIGN KEY (ResultId) REFERENCES dbo.AgentResults (ResultId)
    );
END;

GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_AgentEvidencePackages_RunId'
         AND object_id = OBJECT_ID(N'dbo.AgentEvidencePackages'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_AgentEvidencePackages_RunId
        ON dbo.AgentEvidencePackages (RunId);
END;

GO

/* Migration 251 parity: mutable Socratic intake drafts (ADR 0048). */
IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DraftRequests
    (
        DraftId          UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_DraftRequests PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ProjectId        UNIQUEIDENTIFIER NOT NULL,
        CreatedByUserId  NVARCHAR(256)    NOT NULL,
        Status           NVARCHAR(32)     NOT NULL,
        DocumentJson     NVARCHAR(MAX)    NOT NULL,
        RedirectReason   NVARCHAR(MAX)    NULL,
        SpawnedRunId     NVARCHAR(64)     NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_DraftRequests_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_DraftRequests_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_DraftRequests_DocumentJson CHECK (ISJSON(DocumentJson) = 1),
        CONSTRAINT CK_DraftRequests_Status CHECK (Status IN (
            N'Drafting', N'Admitted', N'Submitted', N'RunSpawned', N'Redirected', N'Abandoned')),
        CONSTRAINT FK_DraftRequests_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_DraftRequests_Scope_Status_UpdatedUtc
        ON dbo.DraftRequests (TenantId, WorkspaceId, ProjectId, Status, UpdatedUtc DESC);
END;

GO

/* Migration 331 parity: pre-serialized GET snapshot for architecture intake drafts. */
IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ReadModelJson') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD ReadModelJson NVARCHAR(MAX) NULL,
            ReadModelSchemaVersion INT NOT NULL
                CONSTRAINT DF_DraftRequests_ReadModelSchemaVersion DEFAULT (0);
END;

GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ReadModelJson') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DraftRequests_ReadModelJson')
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD CONSTRAINT CK_DraftRequests_ReadModelJson
            CHECK (ReadModelJson IS NULL OR ISJSON(ReadModelJson) = 1);
END;

GO

/* 265: Persist navigable sourceEvidenceLinks on advisory recommendations (TB-400). */
IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RecommendationRecords', N'SourceEvidenceLinksJson') IS NULL
BEGIN
    ALTER TABLE dbo.RecommendationRecords
        ADD SourceEvidenceLinksJson NVARCHAR(MAX) NOT NULL
            CONSTRAINT DF_RecommendationRecords_SourceEvidenceLinksJson DEFAULT (N'[]');
END;

GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RecommendationRecords', N'SourceEvidenceLinksJson') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_SourceEvidenceLinksJson_IsJson')
   AND NOT EXISTS (SELECT 1 FROM dbo.RecommendationRecords AS t WHERE ISJSON(t.SourceEvidenceLinksJson) <> 1)
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_SourceEvidenceLinksJson_IsJson
        CHECK (ISJSON(SourceEvidenceLinksJson) = 1);
END;

GO

/* 270: Per-tenant AI budget policy overrides (demo/trial governance). */
IF OBJECT_ID(N'dbo.TenantAiBudgetPolicy', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantAiBudgetPolicy
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantAiBudgetPolicy PRIMARY KEY,
        BudgetAmountUsd         DECIMAL(18, 4)   NULL,
        HardStopEnabled         BIT              NOT NULL CONSTRAINT DF_TenantAiBudgetPolicy_HardStop DEFAULT (1),
        AllowCustomerAiProvider BIT              NOT NULL CONSTRAINT DF_TenantAiBudgetPolicy_CustomerProvider DEFAULT (0),
        TrialExpirationUtc      DATETIMEOFFSET   NULL,
        LastUpdatedUtc          DATETIME2(7)     NOT NULL CONSTRAINT DF_TenantAiBudgetPolicy_Lku DEFAULT SYSUTCDATETIME()
    );
END;

GO

/* 271: AI usage events for demo/trial governance dashboards. */
IF OBJECT_ID(N'dbo.AiUsageEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AiUsageEvents
    (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AiUsageEvents PRIMARY KEY,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        UserId              NVARCHAR(256)    NULL,
        Feature             NVARCHAR(64)     NOT NULL,
        ProviderKind        NVARCHAR(64)     NOT NULL,
        InputTokens         INT              NOT NULL CONSTRAINT DF_AiUsageEvents_InputTokens DEFAULT (0),
        OutputTokens        INT              NOT NULL CONSTRAINT DF_AiUsageEvents_OutputTokens DEFAULT (0),
        EstimatedCostUsd    DECIMAL(18, 6)   NOT NULL CONSTRAINT DF_AiUsageEvents_EstimatedCostUsd DEFAULT (0),
        ActualCostUsd       DECIMAL(18, 6)   NULL,
        OccurredUtc         DATETIMEOFFSET   NOT NULL CONSTRAINT DF_AiUsageEvents_OccurredUtc DEFAULT SYSUTCDATETIME(),
        CorrelationId       NVARCHAR(128)    NULL,
        ServedFromDemoCache BIT              NOT NULL CONSTRAINT DF_AiUsageEvents_ServedFromDemoCache DEFAULT (0),
        BudgetBlocked       BIT              NOT NULL CONSTRAINT DF_AiUsageEvents_BudgetBlocked DEFAULT (0),
        INDEX IX_AiUsageEvents_TenantOccurred NONCLUSTERED (TenantId, OccurredUtc DESC)
    );
END;

GO

/* 275: Azure Boards outbound work-item settings + provider check expansion (see Migrations/275_AzureBoardsWorkManagement.sql). */
IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_TenantItsmConnectorConnections_Provider'
      AND parent_object_id = OBJECT_ID(N'dbo.TenantItsmConnectorConnections'))
BEGIN
    ALTER TABLE dbo.TenantItsmConnectorConnections
        DROP CONSTRAINT CK_TenantItsmConnectorConnections_Provider;
END;

GO

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_TenantItsmConnectorConnections_Provider2'
      AND parent_object_id = OBJECT_ID(N'dbo.TenantItsmConnectorConnections'))
BEGIN
    ALTER TABLE dbo.TenantItsmConnectorConnections
        DROP CONSTRAINT CK_TenantItsmConnectorConnections_Provider2;
END;

GO

IF OBJECT_ID(N'dbo.TenantItsmConnectorConnections', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'CK_TenantItsmConnectorConnections_Provider'
         AND parent_object_id = OBJECT_ID(N'dbo.TenantItsmConnectorConnections'))
BEGIN
    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD CONSTRAINT CK_TenantItsmConnectorConnections_Provider
            CHECK (Provider IN (N'Jira', N'ServiceNow', N'AzureBoards'));
END;

GO

IF OBJECT_ID(N'dbo.TenantAzureBoardsOutboundSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantAzureBoardsOutboundSettings
    (
        TenantId                   UNIQUEIDENTIFIER NOT NULL,
        ProjectName                NVARCHAR(256)    NOT NULL,
        DefaultWorkItemType        NVARCHAR(128)    NOT NULL,
        AreaPath                   NVARCHAR(500)    NULL,
        IterationPath              NVARCHAR(500)    NULL,
        DefaultTags                NVARCHAR(500)    NULL,
        LastConnectionTestUtc      DATETIME2(7)     NULL,
        LastConnectionTestSummary  NVARCHAR(1000)   NULL,
        CONSTRAINT PK_TenantAzureBoardsOutboundSettings PRIMARY KEY (TenantId),
        CONSTRAINT FK_TenantAzureBoardsOutboundSettings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;

GO

/* 276: Policy pack DistributionScope — Organization Private vs Platform (see Migrations/276_PolicyPackDistributionScope.sql). */
IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'DistributionScope') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPacks
        ADD DistributionScope NVARCHAR(50) NOT NULL
            CONSTRAINT DF_PolicyPacks_DistributionScope_Create DEFAULT (N'OrganizationPrivate');
END;

GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'DistributionScope') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_DistributionScope')
BEGIN
    ALTER TABLE dbo.PolicyPacks
        ADD CONSTRAINT CK_PolicyPacks_DistributionScope CHECK (
            DistributionScope IN (
                N'Platform',
                N'OrganizationPrivate',
                N'OrganizationShared',
                N'Marketplace'));
END;

GO

/* 277: Tenant-scoped user invitations — admin invite UI (see Migrations/277_UserInvitations.sql). */
IF OBJECT_ID(N'dbo.UserInvitations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserInvitations
    (
        Id               UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_UserInvitations PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        Email            NVARCHAR(320)    NOT NULL,
        AppRole          NVARCHAR(64)     NOT NULL,
        InvitedByActorId NVARCHAR(256)    NOT NULL,
        Message          NVARCHAR(2000)   NULL,
        TokenHash        VARBINARY(32)    NOT NULL,
        Status           NVARCHAR(16)     NOT NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_UserInvitations_CreatedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc       DATETIME2(7)     NOT NULL,
        RevokedUtc       DATETIME2(7)     NULL,
        AcceptedUtc      DATETIME2(7)     NULL,
        CONSTRAINT CK_UserInvitations_Status CHECK (Status IN (N'Pending', N'Revoked', N'Accepted'))
    );

    CREATE UNIQUE INDEX UX_UserInvitations_PendingEmail
        ON dbo.UserInvitations (TenantId, Email)
        WHERE Status = N'Pending';

    CREATE INDEX IX_UserInvitations_Tenant_List
        ON dbo.UserInvitations (TenantId, CreatedUtc DESC);
END;

GO

/* 278: Tenant-scoped support problem reports — Report problem intake (see Migrations/278_SupportProblemReports.sql). */
IF OBJECT_ID(N'dbo.SupportProblemReports', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SupportProblemReports
    (
        Id                    UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_SupportProblemReports PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ProjectId             UNIQUEIDENTIFIER NULL,
        SubmittedByActorId    NVARCHAR(256)    NOT NULL,
        ContextJson           NVARCHAR(MAX)    NOT NULL,
        OperatorNote          NVARCHAR(2000)   NULL,
        CorrelationId         NVARCHAR(128)    NULL,
        ClientRequestId       NVARCHAR(128)    NULL,
        SupportBundleBlobPath NVARCHAR(1024)   NULL,
        Status                NVARCHAR(16)     NOT NULL,
        CreatedUtc            DATETIME2(7)     NOT NULL
            CONSTRAINT DF_SupportProblemReports_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_SupportProblemReports_Status CHECK (Status IN (N'Open', N'Closed'))
    );

    CREATE INDEX IX_SupportProblemReports_Tenant_Created
        ON dbo.SupportProblemReports (TenantId, CreatedUtc DESC);
END;

GO

/* 279: Provider-independent platform identity model (see Migrations/279_PlatformIdentityModel.sql). */
IF OBJECT_ID(N'dbo.PlatformUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformUsers
    (
        Id                     UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_PlatformUsers PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        PrimaryEmail           NVARCHAR(320)    NULL,
        NormalizedPrimaryEmail NVARCHAR(320)    NULL,
        DisplayName            NVARCHAR(256)    NULL,
        Status                 NVARCHAR(16)     NOT NULL,
        CreatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformUsers_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformUsers_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_PlatformUsers_Status CHECK (Status IN (N'Active', N'Suspended', N'Disabled'))
    );

    CREATE INDEX IX_PlatformUsers_NormalizedPrimaryEmail
        ON dbo.PlatformUsers (NormalizedPrimaryEmail)
        WHERE NormalizedPrimaryEmail IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.AuthenticationIdentities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthenticationIdentities
    (
        Id                        UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_AuthenticationIdentities PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        UserId                    UNIQUEIDENTIFIER NOT NULL,
        ProviderType              NVARCHAR(32)     NOT NULL,
        NormalizedIssuer          NVARCHAR(512)    NOT NULL,
        Subject                   NVARCHAR(256)    NOT NULL,
        NormalizedEmail           NVARCHAR(320)    NULL,
        DisplayEmail              NVARCHAR(320)    NULL,
        EmailVerified             BIT              NOT NULL
            CONSTRAINT DF_AuthenticationIdentities_EmailVerified DEFAULT (0),
        TenantId                  UNIQUEIDENTIFIER NULL,
        TenantIdentityProviderId  UNIQUEIDENTIFIER NULL,
        IdentityScopeKey          AS (
            CONCAT(
                ISNULL(CONVERT(NCHAR(36), TenantId), N'00000000-0000-0000-0000-000000000000'),
                N'|',
                ISNULL(CONVERT(NCHAR(36), TenantIdentityProviderId), N'00000000-0000-0000-0000-000000000000'))
        ) PERSISTED NOT NULL,
        CreatedUtc                DATETIME2(7)     NOT NULL
            CONSTRAINT DF_AuthenticationIdentities_CreatedUtc DEFAULT SYSUTCDATETIME(),
        LastAuthenticatedUtc      DATETIME2(7)     NULL,
        DisabledUtc               DATETIME2(7)     NULL,
        CONSTRAINT FK_AuthenticationIdentities_PlatformUsers FOREIGN KEY (UserId)
            REFERENCES dbo.PlatformUsers (Id),
        CONSTRAINT FK_AuthenticationIdentities_Tenants FOREIGN KEY (TenantId)
            REFERENCES dbo.Tenants (Id),
        CONSTRAINT CK_AuthenticationIdentities_ProviderType CHECK (ProviderType IN (
            N'EmailOneTimeCode',
            N'MicrosoftIdentity',
            N'GoogleIdentity',
            N'TrialLocalPassword',
            N'TenantOidc',
            N'TenantSaml'))
    );

    CREATE UNIQUE INDEX UX_AuthenticationIdentities_ExternalKey
        ON dbo.AuthenticationIdentities (ProviderType, NormalizedIssuer, Subject, IdentityScopeKey)
        WHERE DisabledUtc IS NULL;

    CREATE INDEX IX_AuthenticationIdentities_UserId
        ON dbo.AuthenticationIdentities (UserId)
        INCLUDE (ProviderType, DisabledUtc);
END;

GO

IF OBJECT_ID(N'dbo.WorkspaceMemberships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WorkspaceMemberships
    (
        UserId       UNIQUEIDENTIFIER NOT NULL,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId  UNIQUEIDENTIFIER NOT NULL,
        Role         NVARCHAR(64)     NOT NULL,
        Status       NVARCHAR(16)     NOT NULL,
        CreatedUtc   DATETIME2(7)     NOT NULL
            CONSTRAINT DF_WorkspaceMemberships_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc   DATETIME2(7)     NOT NULL
            CONSTRAINT DF_WorkspaceMemberships_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_WorkspaceMemberships PRIMARY KEY (UserId, WorkspaceId),
        CONSTRAINT FK_WorkspaceMemberships_PlatformUsers FOREIGN KEY (UserId)
            REFERENCES dbo.PlatformUsers (Id),
        CONSTRAINT FK_WorkspaceMemberships_Tenants FOREIGN KEY (TenantId)
            REFERENCES dbo.Tenants (Id),
        CONSTRAINT FK_WorkspaceMemberships_TenantWorkspaces FOREIGN KEY (WorkspaceId)
            REFERENCES dbo.TenantWorkspaces (Id),
        CONSTRAINT CK_WorkspaceMemberships_Status CHECK (Status IN (N'Active', N'Suspended', N'Revoked'))
    );

    CREATE INDEX IX_WorkspaceMemberships_Tenant_Workspace
        ON dbo.WorkspaceMemberships (TenantId, WorkspaceId, Status);
END;

GO

IF OBJECT_ID(N'dbo.IdentityMigrationReviewItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.IdentityMigrationReviewItems
    (
        Id               UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_IdentityMigrationReviewItems PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        LegacySourceType NVARCHAR(32)     NOT NULL,
        LegacySourceId   UNIQUEIDENTIFIER NOT NULL,
        TenantId         UNIQUEIDENTIFIER NULL,
        ReasonCode       NVARCHAR(64)     NOT NULL,
        ReasonDetail     NVARCHAR(2000)   NOT NULL,
        DetectedUtc      DATETIME2(7)     NOT NULL
            CONSTRAINT DF_IdentityMigrationReviewItems_DetectedUtc DEFAULT SYSUTCDATETIME(),
        ResolvedUtc      DATETIME2(7)     NULL,
        CONSTRAINT UQ_IdentityMigrationReviewItems_LegacySource UNIQUE (LegacySourceType, LegacySourceId)
    );

    CREATE INDEX IX_IdentityMigrationReviewItems_Unresolved
        ON dbo.IdentityMigrationReviewItems (DetectedUtc DESC)
        WHERE ResolvedUtc IS NULL;
END;

GO

IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ScimUsers', N'PlatformUserId') IS NULL
BEGIN
    ALTER TABLE dbo.ScimUsers ADD PlatformUserId UNIQUEIDENTIFIER NULL;

    ALTER TABLE dbo.ScimUsers
        ADD CONSTRAINT FK_ScimUsers_PlatformUsers FOREIGN KEY (PlatformUserId)
            REFERENCES dbo.PlatformUsers (Id);
END;

GO

IF OBJECT_ID(N'dbo.IdentityUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IdentityUsers', N'PlatformUserId') IS NULL
BEGIN
    ALTER TABLE dbo.IdentityUsers ADD PlatformUserId UNIQUEIDENTIFIER NULL;

    ALTER TABLE dbo.IdentityUsers
        ADD CONSTRAINT FK_IdentityUsers_PlatformUsers FOREIGN KEY (PlatformUserId)
            REFERENCES dbo.PlatformUsers (Id);
END;

GO

/* 280: Passwordless email OTP challenges and tenant sign-in domain policy (see Migrations/280_EmailOtpAuthentication.sql). */
IF OBJECT_ID(N'dbo.EmailOtpChallenges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailOtpChallenges
    (
        Id                  UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_EmailOtpChallenges PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        NormalizedEmail     NVARCHAR(320)    NOT NULL,
        CodeHash            NVARCHAR(128)    NOT NULL,
        CreatedUtc          DATETIME2(7)     NOT NULL
            CONSTRAINT DF_EmailOtpChallenges_CreatedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc          DATETIME2(7)     NOT NULL,
        FailedAttemptCount  INT              NOT NULL
            CONSTRAINT DF_EmailOtpChallenges_FailedAttemptCount DEFAULT (0),
        CompletedUtc        DATETIME2(7)     NULL,
        InvalidatedUtc      DATETIME2(7)     NULL,
        ClientIpHash        NVARCHAR(64)     NULL,
        UserAgentHash       NVARCHAR(64)     NULL,
        InvitationId        UNIQUEIDENTIFIER NULL,
        RowVersion          ROWVERSION       NOT NULL
    );

    CREATE INDEX IX_EmailOtpChallenges_Email_Active
        ON dbo.EmailOtpChallenges (NormalizedEmail, CreatedUtc DESC)
        WHERE CompletedUtc IS NULL AND InvalidatedUtc IS NULL;

    CREATE INDEX IX_EmailOtpChallenges_ClientIpHash_CreatedUtc
        ON dbo.EmailOtpChallenges (ClientIpHash, CreatedUtc DESC)
        WHERE ClientIpHash IS NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.TenantSignInEmailDomains', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSignInEmailDomains
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        NormalizedDomain        NVARCHAR(253)    NOT NULL,
        RequireEnterpriseSso    BIT              NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomains_RequireEnterpriseSso DEFAULT (1),
        AllowEmailOtpRecovery   BIT              NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomains_AllowEmailOtpRecovery DEFAULT (0),
        CreatedUtc              DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomains_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_TenantSignInEmailDomains PRIMARY KEY (TenantId, NormalizedDomain),
        CONSTRAINT FK_TenantSignInEmailDomains_Tenants FOREIGN KEY (TenantId)
            REFERENCES dbo.Tenants (Id)
    );

    CREATE UNIQUE INDEX UX_TenantSignInEmailDomains_NormalizedDomain
        ON dbo.TenantSignInEmailDomains (NormalizedDomain);
END;

GO

/*
  281: Domain verification, enforcement modes, and recovery administrators for sign-in routing.
*/
IF COL_LENGTH(N'dbo.TenantSignInEmailDomains', N'DisplayDomain') IS NULL
BEGIN
    ALTER TABLE dbo.TenantSignInEmailDomains
        ADD DisplayDomain NVARCHAR(253) NULL,
            VerificationStatus TINYINT NOT NULL
                CONSTRAINT DF_TenantSignInEmailDomains_VerificationStatus DEFAULT (0),
            EnforcementMode TINYINT NOT NULL
                CONSTRAINT DF_TenantSignInEmailDomains_EnforcementMode DEFAULT (0),
            DnsVerificationToken NVARCHAR(64) NULL,
            VerificationPendingUtc DATETIME2(7) NULL,
            VerifiedUtc DATETIME2(7) NULL,
            VerificationFailedUtc DATETIME2(7) NULL,
            RemovedUtc DATETIME2(7) NULL,
            UpdatedUtc DATETIME2(7) NULL,
            RoutingTestPassedUtc DATETIME2(7) NULL,
            EnforcementEnabledUtc DATETIME2(7) NULL;
END;

GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.TenantSignInEmailDomains')
      AND name = N'DisplayDomain'
      AND is_nullable = 1)
BEGIN
    ALTER TABLE dbo.TenantSignInEmailDomains
        ALTER COLUMN DisplayDomain NVARCHAR(253) NOT NULL;
END;

GO

IF OBJECT_ID(N'dbo.TenantSignInEmailDomainRecoveryAdmins', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSignInEmailDomainRecoveryAdmins
    (
        TenantId                      UNIQUEIDENTIFIER NOT NULL,
        NormalizedDomain              NVARCHAR(253)    NOT NULL,
        NormalizedRecoveryAdminEmail  NVARCHAR(320)    NOT NULL,
        DisplayRecoveryAdminEmail     NVARCHAR(320)    NOT NULL,
        AuthenticationVerifiedUtc     DATETIME2(7)     NULL,
        CreatedUtc                    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomainRecoveryAdmins_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CreatedByActorId              NVARCHAR(128)    NOT NULL,
        CONSTRAINT PK_TenantSignInEmailDomainRecoveryAdmins
            PRIMARY KEY (TenantId, NormalizedDomain, NormalizedRecoveryAdminEmail),
        CONSTRAINT FK_TenantSignInEmailDomainRecoveryAdmins_Domains FOREIGN KEY (TenantId, NormalizedDomain)
            REFERENCES dbo.TenantSignInEmailDomains (TenantId, NormalizedDomain)
    );
END;

GO

/*
  282: Pending authentication-identity link proposals (explicit confirmation before attach).
*/
IF OBJECT_ID(N'dbo.AuthenticationIdentityLinkProposals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthenticationIdentityLinkProposals
    (
        Id                          UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_AuthenticationIdentityLinkProposals PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        UserId                      UNIQUEIDENTIFIER NOT NULL,
        ProviderType                TINYINT          NOT NULL,
        NormalizedIssuer            NVARCHAR(512)    NOT NULL,
        Subject                     NVARCHAR(512)    NOT NULL,
        TenantId                    UNIQUEIDENTIFIER NULL,
        TenantIdentityProviderId    UNIQUEIDENTIFIER NULL,
        NormalizedEmail             NVARCHAR(320)    NULL,
        DisplayEmail                NVARCHAR(320)    NULL,
        EmailVerified               BIT              NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_EmailVerified DEFAULT (0),
        RequiresExplicitConfirmation BIT             NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_RequiresExplicitConfirmation DEFAULT (0),
        Status                      TINYINT          NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_Status DEFAULT (0),
        CreatedUtc                  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_CreatedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc                  DATETIME2(7)     NOT NULL,
        ConfirmedUtc                DATETIME2(7)     NULL,
        CancelledUtc                DATETIME2(7)     NULL,
        CONSTRAINT FK_AuthenticationIdentityLinkProposals_PlatformUsers FOREIGN KEY (UserId)
            REFERENCES dbo.PlatformUsers (Id)
    );

    CREATE INDEX IX_AuthenticationIdentityLinkProposals_User_Pending
        ON dbo.AuthenticationIdentityLinkProposals (UserId, CreatedUtc DESC)
        WHERE Status = 0;
END;

GO

/*
  283: Recovery-admin authentication verification and platform-assisted tenant auth recovery grants.
*/
IF COL_LENGTH(N'dbo.TenantSignInEmailDomainRecoveryAdmins', N'AuthenticationVerifiedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.TenantSignInEmailDomainRecoveryAdmins
        ADD AuthenticationVerifiedUtc DATETIME2(7) NULL;
END;

GO

IF OBJECT_ID(N'dbo.PlatformTenantAuthRecoveryGrants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformTenantAuthRecoveryGrants
    (
        GrantId              UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_PlatformTenantAuthRecoveryGrants_GrantId DEFAULT NEWSEQUENTIALID(),
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        NormalizedDomain     NVARCHAR(253)    NOT NULL,
        Reason               NVARCHAR(2000)   NOT NULL,
        EvidenceReference    NVARCHAR(512)    NOT NULL,
        GrantedByActorId     NVARCHAR(128)    NOT NULL,
        GrantedUtc           DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformTenantAuthRecoveryGrants_GrantedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc           DATETIME2(7)     NOT NULL,
        RevokedUtc           DATETIME2(7)     NULL,
        RevokedByActorId     NVARCHAR(128)    NULL,
        TenantNotifiedUtc    DATETIME2(7)     NULL,
        CONSTRAINT PK_PlatformTenantAuthRecoveryGrants PRIMARY KEY (GrantId),
        CONSTRAINT FK_PlatformTenantAuthRecoveryGrants_Domains FOREIGN KEY (TenantId, NormalizedDomain)
            REFERENCES dbo.TenantSignInEmailDomains (TenantId, NormalizedDomain)
    );

    CREATE INDEX IX_PlatformTenantAuthRecoveryGrants_TenantDomain_Active
        ON dbo.PlatformTenantAuthRecoveryGrants (TenantId, NormalizedDomain, ExpiresUtc)
        WHERE RevokedUtc IS NULL;
END;

GO

/* Self-service trial abuse tracking (DbUp 291 parity; renumbered from duplicate 287) */
IF OBJECT_ID(N'dbo.PlatformSelfServiceTrialEmailClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformSelfServiceTrialEmailClaims
    (
        NormalizedEmail   NVARCHAR(320)    NOT NULL
            CONSTRAINT PK_PlatformSelfServiceTrialEmailClaims PRIMARY KEY,
        PlatformUserId    UNIQUEIDENTIFIER NULL,
        TenantId          UNIQUEIDENTIFIER NULL,
        ClaimSource       NVARCHAR(64)     NOT NULL,
        ClaimedUtc        DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformSelfServiceTrialEmailClaims_ClaimedUtc DEFAULT SYSUTCDATETIME()
    );
END;

GO

IF OBJECT_ID(N'dbo.PlatformSelfServiceTrialDomainClaims', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformSelfServiceTrialDomainClaims
    (
        Id                BIGINT           NOT NULL IDENTITY(1,1)
            CONSTRAINT PK_PlatformSelfServiceTrialDomainClaims PRIMARY KEY,
        NormalizedDomain  NVARCHAR(253)    NOT NULL,
        ClaimedUtc        DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformSelfServiceTrialDomainClaims_ClaimedUtc DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_PlatformSelfServiceTrialDomainClaims_Domain_ClaimedUtc
        ON dbo.PlatformSelfServiceTrialDomainClaims (NormalizedDomain, ClaimedUtc DESC);
END;

GO

/* TB-1976 / TB-1977: Architecture intelligence additive lane (DbUp 290 parity) */
IF OBJECT_ID(N'dbo.ArchitectureIntelligenceSources', N'U') IS NULL
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

    CREATE NONCLUSTERED INDEX IX_ArchitectureIntelligenceSources_Tenant_CreatedUtc
        ON dbo.ArchitectureIntelligenceSources (TenantId, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_ArchitectureIntelligenceSources_Tenant_Sha256
        ON dbo.ArchitectureIntelligenceSources (TenantId, ContentSha256);
END;

GO

IF OBJECT_ID(N'dbo.ArchitectureKnowledgeModels', N'U') IS NULL
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

    CREATE NONCLUSTERED INDEX IX_ArchitectureKnowledgeModels_Tenant_UpdatedUtc
        ON dbo.ArchitectureKnowledgeModels (TenantId, UpdatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_ArchitectureKnowledgeModels_Tenant_RunId
        ON dbo.ArchitectureKnowledgeModels (TenantId, RunId)
        WHERE RunId IS NOT NULL;
END;

GO

/* Brownfield: execute-time governance scope JSON (DbUp 321 + 322).
   After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. OBJECT_ID(..., N'U')
   and COL_LENGTH both return NULL for a synonym, so resolve the physical table first. */
DECLARE @governanceScopeTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

IF @governanceScopeTable IS NOT NULL
   AND COL_LENGTH(@governanceScopeTable, N'GovernanceScopeJson') IS NULL
BEGIN
    DECLARE @addGovernanceScopeSql NVARCHAR(MAX) =
        N'ALTER TABLE ' + @governanceScopeTable + N' ADD GovernanceScopeJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @addGovernanceScopeSql;
END

IF @governanceScopeTable IS NOT NULL
BEGIN
    DECLARE @sealGovernanceScopeTriggerSql NVARCHAR(MAX) = N'
CREATE OR ALTER TRIGGER dbo.TR_Runs_SealCommittedHeader
ON ' + @governanceScopeTable + N'
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM inserted)
        RETURN;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        INNER JOIN deleted AS d ON d.RunId = i.RunId
        WHERE d.GoldenManifestId IS NOT NULL
          AND (
              EXISTS (SELECT i.RunId EXCEPT SELECT d.RunId)
              OR EXISTS (SELECT i.ProjectId EXCEPT SELECT d.ProjectId)
              OR EXISTS (SELECT i.TenantId EXCEPT SELECT d.TenantId)
              OR EXISTS (SELECT i.WorkspaceId EXCEPT SELECT d.WorkspaceId)
              OR EXISTS (SELECT i.ScopeProjectId EXCEPT SELECT d.ScopeProjectId)
              OR EXISTS (SELECT i.CreatedUtc EXCEPT SELECT d.CreatedUtc)
              OR EXISTS (SELECT i.ContextSnapshotId EXCEPT SELECT d.ContextSnapshotId)
              OR EXISTS (SELECT i.GraphSnapshotId EXCEPT SELECT d.GraphSnapshotId)
              OR EXISTS (SELECT i.FindingsSnapshotId EXCEPT SELECT d.FindingsSnapshotId)
              OR EXISTS (SELECT i.GoldenManifestId EXCEPT SELECT d.GoldenManifestId)
              OR EXISTS (SELECT i.DecisionTraceId EXCEPT SELECT d.DecisionTraceId)
              OR EXISTS (SELECT i.ArtifactBundleId EXCEPT SELECT d.ArtifactBundleId)
              OR EXISTS (SELECT i.CurrentManifestVersion EXCEPT SELECT d.CurrentManifestVersion)
              OR EXISTS (SELECT i.StructuralExecutionMode EXCEPT SELECT d.StructuralExecutionMode)
              OR EXISTS (SELECT i.OtelTraceId EXCEPT SELECT d.OtelTraceId)
              OR EXISTS (SELECT i.EngineProvenanceJson EXCEPT SELECT d.EngineProvenanceJson)
              OR EXISTS (SELECT i.GovernanceScopeJson EXCEPT SELECT d.GovernanceScopeJson)
          ))
    BEGIN
        THROW 50310, N''Committed run header evidence anchors are immutable (TB-310).'', 1;
    END;
END;';

    EXEC sp_executesql @sealGovernanceScopeTriggerSql;
END

GO

/* 297: Tenant catalog migration fan-out state (TB-2045–TB-2047). */
IF OBJECT_ID(N'dbo.TenantCatalogMigrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantCatalogMigrations
    (
        MigrationId            UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_TenantCatalogMigrations_MigrationId DEFAULT NEWSEQUENTIALID(),
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        CorrelationId          NVARCHAR(128)    NOT NULL,
        Stage                  NVARCHAR(64)     NOT NULL,
        StartedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantCatalogMigrations_StartedUtc DEFAULT SYSUTCDATETIME(),
        CompletedUtc           DATETIME2(7)     NULL,
        MaintenanceMessage     NVARCHAR(1000)   NOT NULL,
        VerificationPassedUtc  DATETIME2(7)     NULL,
        LastVerificationError  NVARCHAR(2000)   NULL,
        CONSTRAINT PK_TenantCatalogMigrations PRIMARY KEY (MigrationId)
    );

    CREATE UNIQUE INDEX UX_TenantCatalogMigrations_Tenant_Active
        ON dbo.TenantCatalogMigrations (TenantId)
        WHERE CompletedUtc IS NULL;
END;

GO

/* 310: Platform agent model catalog (TB-2103) + per-task evaluation evidence (TB-2105). */
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
        ExternalSubprocessorDisclosureComplete BIT NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_ExternalSubprocessorDisclosureComplete DEFAULT (0),
        LifecycleStatus          NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_LifecycleStatus DEFAULT (N'Available'),
        StructuredOutputProbeUtc DATETIME2(7) NULL,
        TokenizerProfile           NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_TokenizerProfile DEFAULT (N'CharHeuristic'),
        CharsPerToken              INT NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_CharsPerToken DEFAULT (4),
        TokenizerErrorMarginPercent DECIMAL(5, 2) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_TokenizerErrorMarginPercent DEFAULT (25.00),
        InputUsdPerMillionTokens   DECIMAL(18, 6) NULL,
        OutputUsdPerMillionTokens  DECIMAL(18, 6) NULL,
        ReasoningUsdPerMillionTokens DECIMAL(18, 6) NULL,
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

IF OBJECT_ID(N'dbo.AgentModelCatalogEntry', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'ExternalSubprocessorDisclosureComplete') IS NULL
BEGIN
    ALTER TABLE dbo.AgentModelCatalogEntry
        ADD ExternalSubprocessorDisclosureComplete BIT NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_ExternalSubprocessorDisclosureComplete DEFAULT (0);
END;

GO

IF OBJECT_ID(N'dbo.AgentModelCatalogEntry', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentModelCatalogEntry', N'TokenizerProfile') IS NULL
BEGIN
    ALTER TABLE dbo.AgentModelCatalogEntry
        ADD TokenizerProfile NVARCHAR(32) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_TokenizerProfile DEFAULT (N'CharHeuristic'),
            CharsPerToken INT NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_CharsPerToken DEFAULT (4),
            TokenizerErrorMarginPercent DECIMAL(5, 2) NOT NULL
            CONSTRAINT DF_AgentModelCatalogEntry_TokenizerErrorMarginPercent DEFAULT (25.00),
            InputUsdPerMillionTokens DECIMAL(18, 6) NULL,
            OutputUsdPerMillionTokens DECIMAL(18, 6) NULL,
            ReasoningUsdPerMillionTokens DECIMAL(18, 6) NULL;
END;

GO

-- TB-2373: architecture posture pillar taxonomy — finding QualityDimension + pillar catalogs.
IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'QualityDimension') IS NULL
BEGIN
    ALTER TABLE dbo.FindingRecords
        ADD QualityDimension NVARCHAR(64) NULL;
END;

GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'QualityDimension') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'IX_FindingRecords_Scope_QualityDimension_Severity'
         AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FindingRecords_Scope_QualityDimension_Severity
        ON dbo.FindingRecords (TenantId, WorkspaceId, ProjectId, QualityDimension, Severity)
        INCLUDE (FindingId);
END;

GO

IF OBJECT_ID(N'dbo.PillarCatalog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PillarCatalog
    (
        PillarKey              NVARCHAR(64)  NOT NULL PRIMARY KEY,
        DisplayName            NVARCHAR(128) NOT NULL,
        DisplayOrder           INT           NOT NULL,
        IsReviewIntegrityAxis  BIT           NOT NULL CONSTRAINT DF_PillarCatalog_IsReviewIntegrityAxis DEFAULT (0)
    );
END;

GO

IF OBJECT_ID(N'dbo.PillarCategoryMap', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PillarCategoryMap
    (
        SourceCategory     NVARCHAR(200) NOT NULL PRIMARY KEY,
        PillarKey          NVARCHAR(64)  NULL,
        IsReviewIntegrity  BIT           NOT NULL CONSTRAINT DF_PillarCategoryMap_IsReviewIntegrity DEFAULT (0),
        CONSTRAINT FK_PillarCategoryMap_PillarCatalog
            FOREIGN KEY (PillarKey) REFERENCES dbo.PillarCatalog (PillarKey)
    );
END;

GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_QualityDimension')
BEGIN
    ALTER TABLE dbo.PolicyPacks DROP CONSTRAINT CK_PolicyPacks_QualityDimension;
END;

GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'QualityDimension') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_QualityDimension')
BEGIN
    ALTER TABLE dbo.PolicyPacks
        ADD CONSTRAINT CK_PolicyPacks_QualityDimension CHECK (
            QualityDimension IS NULL OR QualityDimension IN (
                N'Security',
                N'ReliabilityAndResilience',
                N'CostEffectiveness',
                N'PerformanceAndScalability',
                N'OperationalExcellence',
                N'DataAndCompliance',
                N'SustainabilityAndResourceEfficiency'));
END;

GO

/* 323: First-class architecture identity (tenant-scoped).
   After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH and
   ALTER TABLE against the synonym fail (SQL 4909), so resolve the physical table first. */
IF OBJECT_ID(N'dbo.Architectures', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Architectures
    (
        ArchitectureId           UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_Architectures PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId            UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId         UNIQUEIDENTIFIER NOT NULL,
        CurrentModelId         NVARCHAR(128)    NULL,
        LatestSealedManifestId UNIQUEIDENTIFIER NULL,
        CreatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_Architectures_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_Architectures_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Architectures_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_Architectures_Scope_UpdatedUtc
        ON dbo.Architectures (TenantId, WorkspaceId, ScopeProjectId, UpdatedUtc DESC);
END;

GO

DECLARE @architectureRunTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @architectureRunSql NVARCHAR(MAX);

IF @architectureRunTable IS NOT NULL
BEGIN
    IF COL_LENGTH(@architectureRunTable, N'ArchitectureId') IS NULL
    BEGIN
        SET @architectureRunSql = N'ALTER TABLE ' + @architectureRunTable + N' ADD ArchitectureId UNIQUEIDENTIFIER NULL;';

        EXEC sp_executesql @architectureRunSql;
    END

    IF COL_LENGTH(@architectureRunTable, N'ArchitectureId') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM sys.indexes
           WHERE name = N'IX_Runs_ArchitectureId'
             AND object_id = OBJECT_ID(@architectureRunTable))
    BEGIN
        SET @architectureRunSql = N'
            CREATE INDEX IX_Runs_ArchitectureId
                ON ' + @architectureRunTable + N' (TenantId, WorkspaceId, ScopeProjectId, ArchitectureId)
                WHERE ArchitectureId IS NOT NULL;';

        EXEC sp_executesql @architectureRunSql;
    END
END

GO

/* 324: Architecture-scoped recurrence schedules and persisted improve-loop evidence. */
IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'ArchitectureId') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules ADD ArchitectureId UNIQUEIDENTIFIER NULL;
END;

GO

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'ArchitectureId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ArchitectureReviewRecurrenceSchedules_ArchitectureId'
         AND object_id = OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureReviewRecurrenceSchedules_ArchitectureId
        ON dbo.ArchitectureReviewRecurrenceSchedules (TenantId, ArchitectureId)
        WHERE ArchitectureId IS NOT NULL;
END;

GO

DECLARE @improveLoopRunTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @improveLoopRunSql NVARCHAR(MAX);

IF @improveLoopRunTable IS NOT NULL
   AND COL_LENGTH(@improveLoopRunTable, N'ImproveLoopEvidenceJson') IS NULL
BEGIN
    SET @improveLoopRunSql = N'ALTER TABLE ' + @improveLoopRunTable + N' ADD ImproveLoopEvidenceJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @improveLoopRunSql;
END

GO

/* 325: Pin as-of-run knowledge model id on the physical run table (ADR 0064 synonym-safe). */
DECLARE @knowledgeModelRunTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @knowledgeModelRunSql NVARCHAR(MAX);

IF @knowledgeModelRunTable IS NOT NULL
   AND COL_LENGTH(@knowledgeModelRunTable, N'KnowledgeModelId') IS NULL
BEGIN
    SET @knowledgeModelRunSql = N'ALTER TABLE ' + @knowledgeModelRunTable + N' ADD KnowledgeModelId NVARCHAR(64) NULL;';

    EXEC sp_executesql @knowledgeModelRunSql;
END

GO

/* 337: Review-run creator identity (ADR 0064 synonym-safe). */
DECLARE @createdByUserRunTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @createdByUserRunSql NVARCHAR(MAX);

IF @createdByUserRunTable IS NOT NULL
   AND COL_LENGTH(@createdByUserRunTable, N'CreatedByUserId') IS NULL
BEGIN
    SET @createdByUserRunSql = N'ALTER TABLE ' + @createdByUserRunTable + N' ADD CreatedByUserId NVARCHAR(256) NULL;';

    EXEC sp_executesql @createdByUserRunSql;
END

GO

/* 334: Platform-scoped operational error inbox for internal staff review (HTTP, database, and unhandled exceptions). */
IF OBJECT_ID(N'dbo.PlatformOperationalErrors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformOperationalErrors
    (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PlatformOperationalErrors PRIMARY KEY,
        OccurredUtc      DATETIME2(7)     NOT NULL CONSTRAINT DF_PlatformOperationalErrors_OccurredUtc DEFAULT SYSUTCDATETIME(),
        Source           NVARCHAR(32)     NOT NULL,
        Category         NVARCHAR(32)     NOT NULL,
        HttpStatusCode   INT              NULL,
        HttpMethod       NVARCHAR(16)     NULL,
        RequestPath      NVARCHAR(2048)   NULL,
        ProblemType      NVARCHAR(256)    NULL,
        ExceptionType    NVARCHAR(512)    NULL,
        Message          NVARCHAR(2000)   NOT NULL,
        StackTrace       NVARCHAR(MAX)    NULL,
        SqlErrorNumber   INT              NULL,
        SqlErrorState    INT              NULL,
        CorrelationId    NVARCHAR(128)    NULL,
        OtelTraceId      NVARCHAR(64)     NULL,
        TenantId         UNIQUEIDENTIFIER NULL,
        WorkspaceId      UNIQUEIDENTIFIER NULL,
        ProjectId        UNIQUEIDENTIFIER NULL,
        ActorUserId      NVARCHAR(256)    NULL,
        DetailJson       NVARCHAR(MAX)    NOT NULL CONSTRAINT DF_PlatformOperationalErrors_DetailJson DEFAULT (N'{}'),
        INDEX IX_PlatformOperationalErrors_OccurredUtc NONCLUSTERED (OccurredUtc DESC),
        INDEX IX_PlatformOperationalErrors_Category_OccurredUtc NONCLUSTERED (Category, OccurredUtc DESC),
        INDEX IX_PlatformOperationalErrors_CorrelationId NONCLUSTERED (CorrelationId),
        INDEX IX_PlatformOperationalErrors_TenantId_OccurredUtc NONCLUSTERED (TenantId, OccurredUtc DESC),
        INDEX IX_PlatformOperationalErrors_HttpStatusCode_OccurredUtc NONCLUSTERED (HttpStatusCode, OccurredUtc DESC)
    );
END;

GO

/* ---- DbUp 336 parity: governance environment catalog (see Migrations/336_GovernanceEnvironmentCatalog.sql) ---- */

IF OBJECT_ID(N'dbo.GovernanceEnvironmentDefinitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceEnvironmentDefinitions
    (
        EnvironmentDefinitionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_GovernanceEnvironmentDefinitions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Slug NVARCHAR(64) NOT NULL,
        DisplayName NVARCHAR(200) NOT NULL,
        SortOrder INT NOT NULL,
        IsActive BIT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        LastModifiedUtc DATETIME2 NULL
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_GovernanceEnvironmentDefinitions_Scope_Slug
        ON dbo.GovernanceEnvironmentDefinitions (TenantId, WorkspaceId, ProjectId, Slug);

    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentDefinitions_Scope_SortOrder
        ON dbo.GovernanceEnvironmentDefinitions (TenantId, WorkspaceId, ProjectId, SortOrder);
END;

GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentTransitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceEnvironmentTransitions
    (
        TransitionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_GovernanceEnvironmentTransitions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SourceSlug NVARCHAR(64) NOT NULL,
        TargetSlug NVARCHAR(64) NOT NULL
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_GovernanceEnvironmentTransitions_Scope_Edge
        ON dbo.GovernanceEnvironmentTransitions (TenantId, WorkspaceId, ProjectId, SourceSlug, TargetSlug);

    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentTransitions_Scope_Source
        ON dbo.GovernanceEnvironmentTransitions (TenantId, WorkspaceId, ProjectId, SourceSlug);
END;

GO

/* 337 — Tenant-persisted wizard intake drafts for cross-session resume (robustness #7). */

IF OBJECT_ID(N'dbo.WizardIntakeDrafts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WizardIntakeDrafts
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        WizardId NVARCHAR(128) NOT NULL,
        StepIndex INT NOT NULL,
        StateJson NVARCHAR(MAX) NOT NULL,
        IdempotencyKeyHash VARBINARY(32) NULL,
        UpdatedUtc DATETIME2(3) NOT NULL CONSTRAINT DF_WizardIntakeDrafts_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_WizardIntakeDrafts PRIMARY KEY (TenantId, WorkspaceId, WizardId),
        CONSTRAINT CK_WizardIntakeDrafts_StateJson CHECK (ISJSON(StateJson) = 1)
    );
END;

GO

/* 339: Architecture version lattice — immutable content-addressed revisions per architecture identity. */

IF OBJECT_ID(N'dbo.ArchitectureVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureVersions
    (
        ArchitectureVersionId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ArchitectureVersions PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        ArchitectureId        UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId        UNIQUEIDENTIFIER NOT NULL,
        VersionNumber         INT              NOT NULL,
        ContentHashSha256     VARBINARY(32)    NOT NULL,
        IntakeRequestHashSha256 VARBINARY(32)  NULL,
        SourceRequestId       NVARCHAR(64)     NULL,
        CreatedUtc            DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ArchitectureVersions_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ArchitectureVersions_Architectures
            FOREIGN KEY (ArchitectureId) REFERENCES dbo.Architectures (ArchitectureId),
        CONSTRAINT UQ_ArchitectureVersions_Architecture_VersionNumber
            UNIQUE (ArchitectureId, VersionNumber),
        CONSTRAINT UQ_ArchitectureVersions_Architecture_ContentHash
            UNIQUE (ArchitectureId, ContentHashSha256)
    );

    CREATE INDEX IX_ArchitectureVersions_Scope_Architecture
        ON dbo.ArchitectureVersions (TenantId, WorkspaceId, ScopeProjectId, ArchitectureId, VersionNumber DESC);
END;

GO

IF OBJECT_ID(N'dbo.ArchitectureVersions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureVersions', N'IntakeRequestHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureVersions
        ADD IntakeRequestHashSha256 VARBINARY(32) NULL;
END;

GO

DECLARE @architectureVersionRunTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @architectureVersionRunSql NVARCHAR(MAX);

IF @architectureVersionRunTable IS NOT NULL
BEGIN
    IF COL_LENGTH(@architectureVersionRunTable, N'ArchitectureVersionId') IS NULL
    BEGIN
        SET @architectureVersionRunSql = N'ALTER TABLE ' + @architectureVersionRunTable + N' ADD ArchitectureVersionId UNIQUEIDENTIFIER NULL;';

        EXEC sp_executesql @architectureVersionRunSql;
    END

    IF COL_LENGTH(@architectureVersionRunTable, N'ArchitectureVersionId') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM sys.indexes
           WHERE name = N'IX_Runs_ArchitectureVersionId'
             AND object_id = OBJECT_ID(@architectureVersionRunTable))
    BEGIN
        SET @architectureVersionRunSql = N'
            CREATE INDEX IX_Runs_ArchitectureVersionId
                ON ' + @architectureVersionRunTable + N' (TenantId, WorkspaceId, ScopeProjectId, ArchitectureVersionId)
                WHERE ArchitectureVersionId IS NOT NULL;';

        EXEC sp_executesql @architectureVersionRunSql;
    END
END

GO

/* 340: Draft spawn revision pin on intake drafts. */

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedArchitectureVersionId') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD SpawnedArchitectureVersionId UNIQUEIDENTIFIER NULL;
END;

GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedArchitectureVersionId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_DraftRequests_SpawnedArchitectureVersionId'
         AND object_id = OBJECT_ID(N'dbo.DraftRequests'))
BEGIN
    CREATE INDEX IX_DraftRequests_SpawnedArchitectureVersionId
        ON dbo.DraftRequests (TenantId, WorkspaceId, ProjectId, SpawnedArchitectureVersionId)
        WHERE SpawnedArchitectureVersionId IS NOT NULL;
END;

GO

/* 341: Draft document content hash pin at spawn. */

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'DocumentContentHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD DocumentContentHashSha256 VARBINARY(32) NULL;
END;

GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedDocumentContentHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD SpawnedDocumentContentHashSha256 VARBINARY(32) NULL;
END;

GO

/* 342: Wave-4 robustness — pin theory-in-force policy pack ids on run create.
   After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH on the
   synonym returns NULL, so ALTER TABLE dbo.Runs raises SQL 4909. DDL targets the physical
   table (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql. */
DECLARE @policyPackPinRunTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @policyPackPinRunSql NVARCHAR(MAX);

IF @policyPackPinRunTable IS NOT NULL
   AND COL_LENGTH(@policyPackPinRunTable, N'PinnedPolicyPackIdsJson') IS NULL
BEGIN
    SET @policyPackPinRunSql = N'ALTER TABLE ' + @policyPackPinRunTable + N' ADD PinnedPolicyPackIdsJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @policyPackPinRunSql;
END

IF @policyPackPinRunTable IS NOT NULL
   AND COL_LENGTH(@policyPackPinRunTable, N'PinnedPolicyPackIdsHashSha256') IS NULL
BEGIN
    SET @policyPackPinRunSql = N'ALTER TABLE ' + @policyPackPinRunTable + N' ADD PinnedPolicyPackIdsHashSha256 VARBINARY(32) NULL;';

    EXEC sp_executesql @policyPackPinRunSql;
END

GO

/* 343: Wave-6 robustness — create-time evidence pins and focused-pilot scope on run headers.
   After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH on the
   synonym returns NULL, so ALTER TABLE dbo.Runs raises SQL 4909. DDL targets the physical
   table (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql. */
DECLARE @wave6PinRunTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @wave6PinRunSql NVARCHAR(MAX);

IF @wave6PinRunTable IS NOT NULL
   AND COL_LENGTH(@wave6PinRunTable, N'PinnedEvidencePackagePinsJson') IS NULL
BEGIN
    SET @wave6PinRunSql = N'ALTER TABLE ' + @wave6PinRunTable + N' ADD PinnedEvidencePackagePinsJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @wave6PinRunSql;
END

IF @wave6PinRunTable IS NOT NULL
   AND COL_LENGTH(@wave6PinRunTable, N'PinnedEvidencePackagePinsHashSha256') IS NULL
BEGIN
    SET @wave6PinRunSql = N'ALTER TABLE ' + @wave6PinRunTable + N' ADD PinnedEvidencePackagePinsHashSha256 VARBINARY(32) NULL;';

    EXEC sp_executesql @wave6PinRunSql;
END

IF @wave6PinRunTable IS NOT NULL
   AND COL_LENGTH(@wave6PinRunTable, N'PinnedFocusedPilotModeEnabled') IS NULL
BEGIN
    SET @wave6PinRunSql = N'ALTER TABLE ' + @wave6PinRunTable + N' ADD PinnedFocusedPilotModeEnabled BIT NULL;';

    EXEC sp_executesql @wave6PinRunSql;
END

IF @wave6PinRunTable IS NOT NULL
   AND COL_LENGTH(@wave6PinRunTable, N'PinnedFocusedPilotCloudProvider') IS NULL
BEGIN
    SET @wave6PinRunSql = N'ALTER TABLE ' + @wave6PinRunTable + N' ADD PinnedFocusedPilotCloudProvider INT NULL;';

    EXEC sp_executesql @wave6PinRunSql;
END

GO

/* 344: Wave-9 robustness — create-time architecture version content hash (κ) on run headers.
   After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH on the
   synonym returns NULL, so ALTER TABLE dbo.Runs raises SQL 4909. DDL targets the physical
   table (dbo.Reviews first, pre-295 dbo.Runs fallback) via sp_executesql. */
DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'PinnedArchitectureVersionContentHashSha256') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD PinnedArchitectureVersionContentHashSha256 VARBINARY(32) NULL;';

    EXEC sp_executesql @sql;
END

GO

/*
  345: Wave-10 robustness — create-time knowledge model content hash (κ) on run headers.
*/

DECLARE @runTable345 sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql345 NVARCHAR(MAX);

IF @runTable345 IS NOT NULL
   AND COL_LENGTH(@runTable345, N'PinnedKnowledgeModelContentHashSha256') IS NULL
BEGIN
    SET @sql345 = N'ALTER TABLE ' + @runTable345 + N' ADD PinnedKnowledgeModelContentHashSha256 VARBINARY(32) NULL;';

    EXEC sp_executesql @sql345;
END

GO

/*
  346: Organization-required flag on policy pack assignments (distinct from merge-precedence IsPinned).
*/

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'IsOrganizationRequired') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPackAssignments
        ADD IsOrganizationRequired BIT NOT NULL
            CONSTRAINT DF_PolicyPackAssignments_IsOrganizationRequired DEFAULT (0);
END;

GO

/*
  347: Infrastructure-evidence plane foundation — Azure inventory snapshots, cloud resource identity,
       audit framework catalog, and tenant branding profiles (IE-01, IE-04, AE-01, BR-01).
*/

IF OBJECT_ID(N'dbo.AzureInventorySnapshots', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventorySnapshots
    (
        SnapshotId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventorySnapshots PRIMARY KEY CLUSTERED,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ProjectId             UNIQUEIDENTIFIER NOT NULL,
        PackageId             UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId        NVARCHAR(128)     NULL,
        SubscriptionName      NVARCHAR(256)     NULL,
        CapturedUtc           DATETIME2         NULL,
        CaptureStatus         INT               NOT NULL,
        CaptureVersion        NVARCHAR(64)      NULL,
        ResourceCount         INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_ResourceCount DEFAULT (0),
        RelationshipCount     INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_RelationshipCount DEFAULT (0),
        CaptureMethod         INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_CaptureMethod DEFAULT (0),
        CollectorVersion      NVARCHAR(64)      NULL,
        RequestedBy           NVARCHAR(256)     NULL,
        DurationMs            INT               NULL,
        CompletenessScore     DECIMAL(5, 4)     NULL,
        WarningCount          INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_WarningCount DEFAULT (0),
        ErrorCount            INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_ErrorCount DEFAULT (0),
        ContentHashSha256     VARBINARY(32)     NULL,
        CreatedUtc            DATETIME2         NOT NULL,
        UpdatedUtc            DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventorySnapshots_Packages FOREIGN KEY (PackageId) REFERENCES dbo.AzureExtractorPackages (PackageId),
        CONSTRAINT UQ_AzureInventorySnapshots_Tenant_Package UNIQUE (TenantId, PackageId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventorySnapshots_Tenant_Snapshot
        ON dbo.AzureInventorySnapshots (TenantId, SnapshotId);

    CREATE NONCLUSTERED INDEX IX_AzureInventorySnapshots_Scope_Created
        ON dbo.AzureInventorySnapshots (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryResources', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryResources
    (
        ResourceRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryResources PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId         UNIQUEIDENTIFIER NULL,
        AzureResourceId         NVARCHAR(1024)    NOT NULL,
        ResourceType            NVARCHAR(256)     NOT NULL,
        Region                  NVARCHAR(128)     NULL,
        ResourceGroup           NVARCHAR(256)     NULL,
        SubscriptionId          NVARCHAR(128)     NULL,
        ParentResourceId        NVARCHAR(1024)    NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryResources_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResources_Tenant_Snapshot
        ON dbo.AzureInventoryResources (TenantId, SnapshotId);

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResources_Tenant_AzureResourceId
        ON dbo.AzureInventoryResources (TenantId, AzureResourceId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryResourceProperties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryResourceProperties
    (
        PropertyRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryResourceProperties PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        ResourceRowId           UNIQUEIDENTIFIER NOT NULL,
        PropertyKey             NVARCHAR(256)     NOT NULL,
        PropertyValue           NVARCHAR(4000)    NULL,
        IsRedacted              BIT               NOT NULL CONSTRAINT DF_AzureInventoryResourceProperties_IsRedacted DEFAULT (0),
        BlobPointer             NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryResourceProperties_Resources FOREIGN KEY (ResourceRowId) REFERENCES dbo.AzureInventoryResources (ResourceRowId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResourceProperties_Tenant_Snapshot
        ON dbo.AzureInventoryResourceProperties (TenantId, SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryResourceRelationships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryResourceRelationships
    (
        RelationshipRowId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryResourceRelationships PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        FromAzureResourceId     NVARCHAR(1024)    NOT NULL,
        ToAzureResourceId       NVARCHAR(1024)    NOT NULL,
        RelationshipType        NVARCHAR(128)     NOT NULL,
        ProvenanceKind          INT               NOT NULL,
        Confidence              DECIMAL(5, 4)     NULL,
        InferenceSource         NVARCHAR(256)     NULL,
        CONSTRAINT FK_AzureInventoryResourceRelationships_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResourceRelationships_Tenant_Snapshot
        ON dbo.AzureInventoryResourceRelationships (TenantId, SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryIdentities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryIdentities
    (
        IdentityRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryIdentities PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        IdentityType            NVARCHAR(128)     NOT NULL,
        PrincipalId             NVARCHAR(256)     NOT NULL,
        DisplayName             NVARCHAR(512)     NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryIdentities_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryIdentities_Tenant_Snapshot
        ON dbo.AzureInventoryIdentities (TenantId, SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryRoleAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryRoleAssignments
    (
        RoleAssignmentRowId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryRoleAssignments PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        Scope                   NVARCHAR(1024)    NOT NULL,
        PrincipalId             NVARCHAR(256)     NOT NULL,
        RoleDefinitionId        NVARCHAR(1024)    NOT NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryRoleAssignments_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryRoleAssignments_Tenant_Snapshot
        ON dbo.AzureInventoryRoleAssignments (TenantId, SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryTags', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryTags
    (
        TagRowId                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryTags PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        ResourceRowId           UNIQUEIDENTIFIER NOT NULL,
        TagKey                  NVARCHAR(256)     NOT NULL,
        TagValue                NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryTags_Resources FOREIGN KEY (ResourceRowId) REFERENCES dbo.AzureInventoryResources (ResourceRowId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryTags_Tenant_Snapshot
        ON dbo.AzureInventoryTags (TenantId, SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryDiagnosticConfigurations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDiagnosticConfigurations
    (
        DiagnosticRowId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDiagnosticConfigurations PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        TargetAzureResourceId   NVARCHAR(1024)    NOT NULL,
        DiagnosticName          NVARCHAR(256)     NOT NULL,
        WorkspaceResourceId     NVARCHAR(1024)    NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDiagnosticConfigurations_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDiagnosticConfigurations_Tenant_Snapshot
        ON dbo.AzureInventoryDiagnosticConfigurations (TenantId, SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryUnknownResources', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryUnknownResources
    (
        UnknownResourceRowId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryUnknownResources PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        AzureResourceId         NVARCHAR(1024)    NOT NULL,
        ResourceType            NVARCHAR(256)     NOT NULL,
        ResourceGroup           NVARCHAR(256)     NULL,
        CappedPropertiesJson    NVARCHAR(MAX)     NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryUnknownResources_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryUnknownResources_Tenant_Snapshot
        ON dbo.AzureInventoryUnknownResources (TenantId, SnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.CloudResourceIdentities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CloudResourceIdentities
    (
        CloudResourceId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CloudResourceIdentities PRIMARY KEY CLUSTERED,
        TenantId                      UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId                   UNIQUEIDENTIFIER NOT NULL,
        ProjectId                     UNIQUEIDENTIFIER NOT NULL,
        Provider                      INT               NOT NULL,
        ExternalResourceIdNormalized  NVARCHAR(1024)    NOT NULL,
        ResourceType                  NVARCHAR(256)     NULL,
        SubscriptionOrAccountId       NVARCHAR(128)     NULL,
        ResourceGroupOrProject        NVARCHAR(256)     NULL,
        Region                        NVARCHAR(128)     NULL,
        DisplayName                   NVARCHAR(512)     NULL,
        FirstSeenSnapshotId           UNIQUEIDENTIFIER NULL,
        LastSeenSnapshotId            UNIQUEIDENTIFIER NULL,
        FirstSeenUtc                  DATETIME2         NOT NULL,
        LastSeenUtc                   DATETIME2         NOT NULL,
        CONSTRAINT UQ_CloudResourceIdentities_Tenant_Provider_External UNIQUE (TenantId, Provider, ExternalResourceIdNormalized)
    );

    CREATE NONCLUSTERED INDEX IX_CloudResourceIdentities_Tenant_Provider
        ON dbo.CloudResourceIdentities (TenantId, Provider);
END;

GO

IF OBJECT_ID(N'dbo.AuditFrameworks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditFrameworks
    (
        FrameworkId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditFrameworks PRIMARY KEY CLUSTERED,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        Name                  NVARCHAR(256)     NOT NULL,
        Version               NVARCHAR(64)      NOT NULL,
        Publisher             NVARCHAR(256)     NULL,
        EffectiveDate         DATE              NULL,
        SourceReference       NVARCHAR(512)     NOT NULL,
        Status                INT               NOT NULL,
        ContentHashSha256     VARBINARY(32)     NOT NULL,
        SpecBlob              VARBINARY(MAX)    NOT NULL,
        ImportedBy            NVARCHAR(256)     NULL,
        CreatedUtc            DATETIME2         NOT NULL,
        CONSTRAINT UQ_AuditFrameworks_Tenant_Version_Hash UNIQUE (TenantId, Version, ContentHashSha256)
    );

    CREATE NONCLUSTERED INDEX IX_AuditFrameworks_Tenant_Created
        ON dbo.AuditFrameworks (TenantId, CreatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.AuditControls', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditControls
    (
        ControlId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditControls PRIMARY KEY CLUSTERED,
        FrameworkId           UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        ControlNumber         NVARCHAR(64)      NOT NULL,
        Title                 NVARCHAR(512)     NOT NULL,
        Description           NVARCHAR(MAX)     NULL,
        Objective             NVARCHAR(MAX)     NULL,
        Applicability         NVARCHAR(512)     NULL,
        ControlType           NVARCHAR(128)     NULL,
        ParentControlId       UNIQUEIDENTIFIER NULL,
        EvaluationGuidance    NVARCHAR(MAX)     NULL,
        CONSTRAINT FK_AuditControls_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditControls_Tenant_Framework
        ON dbo.AuditControls (TenantId, FrameworkId);
END;

GO

IF OBJECT_ID(N'dbo.AuditControlMetadata', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditControlMetadata
    (
        MetadataRowId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditControlMetadata PRIMARY KEY CLUSTERED,
        ControlId             UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        MetadataKey           NVARCHAR(128)     NOT NULL,
        MetadataValue         NVARCHAR(1024)    NULL,
        CONSTRAINT FK_AuditControlMetadata_Controls FOREIGN KEY (ControlId) REFERENCES dbo.AuditControls (ControlId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditControlMetadata_Tenant_Control
        ON dbo.AuditControlMetadata (TenantId, ControlId);
END;

GO

IF OBJECT_ID(N'dbo.TenantBrandingProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantBrandingProfiles
    (
        BrandingProfileId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantBrandingProfiles PRIMARY KEY CLUSTERED,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        CompanyDisplayName        NVARCHAR(256)     NULL,
        CompanyLegalName          NVARCHAR(512)     NULL,
        ShortDisplayName          NVARCHAR(128)     NULL,
        LogoPrimaryAssetId        UNIQUEIDENTIFIER NULL,
        LogoSecondaryAssetId      UNIQUEIDENTIFIER NULL,
        LogoSquareAssetId         UNIQUEIDENTIFIER NULL,
        LogoFaviconAssetId        UNIQUEIDENTIFIER NULL,
        LogoDarkAssetId           UNIQUEIDENTIFIER NULL,
        LogoLightAssetId          UNIQUEIDENTIFIER NULL,
        LogoReportCoverAssetId    UNIQUEIDENTIFIER NULL,
        LogoMonoAssetId           UNIQUEIDENTIFIER NULL,
        PrimaryColor              NVARCHAR(16)      NULL,
        SecondaryColor            NVARCHAR(16)      NULL,
        AccentColor               NVARCHAR(16)      NULL,
        BackgroundColor           NVARCHAR(16)      NULL,
        ForegroundColor           NVARCHAR(16)      NULL,
        TypographyJson            NVARCHAR(MAX)     NULL,
        Tagline                   NVARCHAR(512)     NULL,
        WebsiteUrl                NVARCHAR(2048)    NULL,
        SupportUrl                NVARCHAR(2048)    NULL,
        BrandingStatus            INT               NOT NULL,
        Version                   INT               NOT NULL,
        CreatedUtc                DATETIME2         NOT NULL,
        UpdatedUtc                DATETIME2         NOT NULL,
        CreatedBy                 NVARCHAR(256)     NULL,
        UpdatedBy                 NVARCHAR(256)     NULL
    );

    CREATE NONCLUSTERED INDEX IX_TenantBrandingProfiles_Tenant_Status
        ON dbo.TenantBrandingProfiles (TenantId, BrandingStatus);

    CREATE UNIQUE NONCLUSTERED INDEX UX_TenantBrandingProfiles_Tenant_Active
        ON dbo.TenantBrandingProfiles (TenantId)
        WHERE BrandingStatus = 2;
END;

GO

/*
  348: Infrastructure-evidence semantic diff and advisory Terraform mapping (IE-05, IE-06).
*/

IF OBJECT_ID(N'dbo.AzureInventoryDiffs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDiffs
    (
        DiffId                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDiffs PRIMARY KEY CLUSTERED,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId               UNIQUEIDENTIFIER NOT NULL,
        ProjectId                 UNIQUEIDENTIFIER NOT NULL,
        SnapshotAId               UNIQUEIDENTIFIER NOT NULL,
        SnapshotBId               UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId            NVARCHAR(128)     NULL,
        TotalChanges              INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_TotalChanges DEFAULT (0),
        ResourceAddedCount        INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_ResourceAddedCount DEFAULT (0),
        ResourceRemovedCount      INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_ResourceRemovedCount DEFAULT (0),
        ResourceModifiedCount     INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_ResourceModifiedCount DEFAULT (0),
        NetworkExposureChangeCount INT              NOT NULL CONSTRAINT DF_AzureInventoryDiffs_NetworkExposureChangeCount DEFAULT (0),
        PermissionChangeCount     INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_PermissionChangeCount DEFAULT (0),
        LoggingRegressionCount    INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_LoggingRegressionCount DEFAULT (0),
        NewPrivateEndpointCount   INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_NewPrivateEndpointCount DEFAULT (0),
        RelationshipRemovedCount  INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_RelationshipRemovedCount DEFAULT (0),
        CreatedUtc                DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventoryDiffs_SnapshotA FOREIGN KEY (SnapshotAId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT FK_AzureInventoryDiffs_SnapshotB FOREIGN KEY (SnapshotBId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT UQ_AzureInventoryDiffs_Tenant_SnapshotPair UNIQUE (TenantId, SnapshotAId, SnapshotBId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDiffs_Tenant_Snapshots
        ON dbo.AzureInventoryDiffs (TenantId, SnapshotAId, SnapshotBId);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryChanges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryChanges
    (
        ChangeId                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryChanges PRIMARY KEY CLUSTERED,
        DiffId                    UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        SnapshotAId               UNIQUEIDENTIFIER NOT NULL,
        SnapshotBId               UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId           UNIQUEIDENTIFIER NULL,
        AzureResourceId           NVARCHAR(1024)    NULL,
        ChangeType                INT               NOT NULL,
        Property                  NVARCHAR(256)     NULL,
        OldValue                  NVARCHAR(4000)    NULL,
        NewValue                  NVARCHAR(4000)    NULL,
        RiskClassification        NVARCHAR(128)     NULL,
        ArchitectureSignificance  NVARCHAR(256)     NULL,
        SecuritySignificance      NVARCHAR(256)     NULL,
        Confidence                DECIMAL(5, 4)     NULL,
        EvidenceReference         NVARCHAR(512)     NULL,
        ProvenanceKind            INT               NOT NULL,
        CONSTRAINT FK_AzureInventoryChanges_Diffs FOREIGN KEY (DiffId) REFERENCES dbo.AzureInventoryDiffs (DiffId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryChanges_Tenant_Diff
        ON dbo.AzureInventoryChanges (TenantId, DiffId);
END;

GO

IF OBJECT_ID(N'dbo.AdvisoryTerraformResourceMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdvisoryTerraformResourceMappings
    (
        MappingId                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AdvisoryTerraformResourceMappings PRIMARY KEY CLUSTERED,
        SnapshotId                UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId           UNIQUEIDENTIFIER NULL,
        AzureResourceId           NVARCHAR(1024)    NOT NULL,
        TerraformAddress          NVARCHAR(512)     NOT NULL,
        CategoryFolder            NVARCHAR(64)      NOT NULL,
        GenerationMethod          INT               NOT NULL,
        UncertaintyNotes          NVARCHAR(2000)    NULL,
        CreatedUtc                DATETIME2         NOT NULL,
        CONSTRAINT FK_AdvisoryTerraformResourceMappings_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AdvisoryTerraformResourceMappings_Tenant_Snapshot
        ON dbo.AdvisoryTerraformResourceMappings (TenantId, SnapshotId);
END;

GO

/*
  349: Infrastructure-evidence baselines, drift approvals, and diff narratives (IE-07, IE-08).
*/

IF OBJECT_ID(N'dbo.AzureInventoryBaselines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryBaselines
    (
        BaselineId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryBaselines PRIMARY KEY CLUSTERED,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL,
        SnapshotId        UNIQUEIDENTIFIER NOT NULL,
        BaselineKind      INT               NOT NULL,
        SubscriptionId    NVARCHAR(128)     NULL,
        DesignatedBy      NVARCHAR(256)     NOT NULL,
        DesignatedUtc     DATETIME2         NOT NULL,
        Notes             NVARCHAR(2000)    NULL,
        CONSTRAINT FK_AzureInventoryBaselines_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryBaselines_Tenant_Kind
        ON dbo.AzureInventoryBaselines (TenantId, BaselineKind, DesignatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryDriftApprovals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDriftApprovals
    (
        ApprovalId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDriftApprovals PRIMARY KEY CLUSTERED,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL,
        DiffId            UNIQUEIDENTIFIER NOT NULL,
        ChangeId          UNIQUEIDENTIFIER NULL,
        Approver          NVARCHAR(256)     NOT NULL,
        Reason            NVARCHAR(2000)    NOT NULL,
        TicketReference   NVARCHAR(256)     NULL,
        ExpirationUtc     DATETIME2         NOT NULL,
        Status            INT               NOT NULL,
        CreatedUtc        DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventoryDriftApprovals_Diffs FOREIGN KEY (DiffId) REFERENCES dbo.AzureInventoryDiffs (DiffId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDriftApprovals_Tenant_Diff_Status
        ON dbo.AzureInventoryDriftApprovals (TenantId, DiffId, Status, ExpirationUtc);
END;

GO

IF OBJECT_ID(N'dbo.AzureInventoryDiffNarratives', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDiffNarratives
    (
        NarrativeId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDiffNarratives PRIMARY KEY CLUSTERED,
        DiffId            UNIQUEIDENTIFIER NOT NULL,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        NarrativeKind     INT               NOT NULL,
        NarrativeText     NVARCHAR(MAX)     NOT NULL,
        CitedChangeIdsJson NVARCHAR(MAX)    NOT NULL,
        ProvenanceKind    INT               NOT NULL,
        SimulatorLabel    NVARCHAR(64)      NULL,
        CreatedUtc        DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventoryDiffNarratives_Diffs FOREIGN KEY (DiffId) REFERENCES dbo.AzureInventoryDiffs (DiffId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDiffNarratives_Tenant_Diff
        ON dbo.AzureInventoryDiffNarratives (TenantId, DiffId, CreatedUtc DESC);
END;

GO

/*
  350: Audit evidence requirements (AE-02).
*/

IF OBJECT_ID(N'dbo.AuditEvidenceRequirements', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceRequirements
    (
        RequirementId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceRequirements PRIMARY KEY CLUSTERED,
        ControlId             UNIQUEIDENTIFIER NOT NULL,
        FrameworkId           UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        Name                  NVARCHAR(256)     NOT NULL,
        Description           NVARCHAR(2000)    NULL,
        EvidenceType          NVARCHAR(128)     NOT NULL,
        RequiredAzureScopes   NVARCHAR(512)     NULL,
        RequiredResourceTypes NVARCHAR(512)     NULL,
        CollectionMethod      NVARCHAR(128)     NULL,
        Frequency             NVARCHAR(128)     NULL,
        EvaluationMethod      NVARCHAR(128)     NULL,
        ManualEvidenceAllowed BIT               NOT NULL,
        RequiredFreshness     NVARCHAR(128)     NULL,
        AutomationClass       INT               NOT NULL,
        CONSTRAINT FK_AuditEvidenceRequirements_Controls FOREIGN KEY (ControlId) REFERENCES dbo.AuditControls (ControlId),
        CONSTRAINT FK_AuditEvidenceRequirements_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceRequirements_Tenant_Framework
        ON dbo.AuditEvidenceRequirements (TenantId, FrameworkId, EvidenceType);
END;

GO

/*
  351: Audit control evaluations and evidence items (AE-03).
*/

IF OBJECT_ID(N'dbo.AuditControlEvaluations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditControlEvaluations
    (
        EvaluationId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditControlEvaluations PRIMARY KEY CLUSTERED,
        ControlId           UNIQUEIDENTIFIER NOT NULL,
        FrameworkId         UNIQUEIDENTIFIER NOT NULL,
        SnapshotId          UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        Outcome             INT               NOT NULL,
        PassCount           INT               NOT NULL,
        ApplicableCount     INT               NOT NULL,
        Confidence          DECIMAL(5, 4)     NOT NULL,
        EvaluationText      NVARCHAR(MAX)     NOT NULL,
        Formula             NVARCHAR(2000)    NOT NULL,
        RequirementIdsJson  NVARCHAR(MAX)     NOT NULL,
        ExceptionIdsJson    NVARCHAR(MAX)     NOT NULL,
        ProvenanceKind      INT               NOT NULL,
        HumanDisposition    NVARCHAR(256)     NULL,
        Notes               NVARCHAR(2000)    NULL,
        CreatedUtc          DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditControlEvaluations_Controls FOREIGN KEY (ControlId) REFERENCES dbo.AuditControls (ControlId),
        CONSTRAINT FK_AuditControlEvaluations_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditControlEvaluations_Tenant_Control_Snapshot
        ON dbo.AuditControlEvaluations (TenantId, ControlId, SnapshotId, CreatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvidenceItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceItems
    (
        EvidenceItemId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceItems PRIMARY KEY CLUSTERED,
        EvaluationId        UNIQUEIDENTIFIER NOT NULL,
        RequirementId       UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId     UNIQUEIDENTIFIER NULL,
        AzureResourceId     NVARCHAR(1024)    NULL,
        EvidenceType        NVARCHAR(128)     NOT NULL,
        Summary             NVARCHAR(2000)    NOT NULL,
        CollectionStatus    INT               NOT NULL,
        ProvenanceKind      INT               NOT NULL,
        CreatedUtc          DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditEvidenceItems_Evaluations FOREIGN KEY (EvaluationId) REFERENCES dbo.AuditControlEvaluations (EvaluationId),
        CONSTRAINT FK_AuditEvidenceItems_Requirements FOREIGN KEY (RequirementId) REFERENCES dbo.AuditEvidenceRequirements (RequirementId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceItems_Tenant_Evaluation
        ON dbo.AuditEvidenceItems (TenantId, EvaluationId);
END;

GO

/*
  352: Audit assessments and immutable audit evidence snapshots (AE-04).
*/

IF OBJECT_ID(N'dbo.AuditAssessments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditAssessments
    (
        AssessmentId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditAssessments PRIMARY KEY CLUSTERED,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId         UNIQUEIDENTIFIER NOT NULL,
        ProjectId           UNIQUEIDENTIFIER NOT NULL,
        FrameworkId           UNIQUEIDENTIFIER NOT NULL,
        FrameworkVersion      NVARCHAR(64)      NOT NULL,
        ScopeJson             NVARCHAR(MAX)     NOT NULL,
        PeriodStartUtc        DATETIME2         NULL,
        PeriodEndUtc          DATETIME2         NULL,
        Status                INT               NOT NULL,
        RequestedBy           NVARCHAR(256)     NOT NULL,
        CreatedUtc            DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditAssessments_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditAssessments_Tenant_Created
        ON dbo.AuditAssessments (TenantId, CreatedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshots', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceSnapshots
    (
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceSnapshots PRIMARY KEY CLUSTERED,
        AssessmentId            UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        SubscriptionIdsJson     NVARCHAR(MAX)     NOT NULL,
        CollectionStartedUtc    DATETIME2         NOT NULL,
        CollectionCompletedUtc  DATETIME2         NOT NULL,
        SelectorVersionsJson    NVARCHAR(MAX)     NOT NULL,
        FrameworkVersion        NVARCHAR(64)      NOT NULL,
        ControlCatalogVersion   NVARCHAR(128)     NOT NULL,
        Completeness            DECIMAL(5, 4)     NOT NULL,
        FailuresJson            NVARCHAR(MAX)     NOT NULL,
        WarningsJson            NVARCHAR(MAX)     NOT NULL,
        EvidenceHashSha256      VARBINARY(32)     NOT NULL,
        CreatedUtc              DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditEvidenceSnapshots_Assessments FOREIGN KEY (AssessmentId) REFERENCES dbo.AuditAssessments (AssessmentId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceSnapshots_Tenant_Assessment
        ON dbo.AuditEvidenceSnapshots (TenantId, AssessmentId, CollectionCompletedUtc DESC);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshotInventoryLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceSnapshotInventoryLinks
    (
        LinkId                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceSnapshotInventoryLinks PRIMARY KEY CLUSTERED,
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL,
        AzureInventorySnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_AuditEvidenceSnapshotInventoryLinks_Snapshots FOREIGN KEY (AuditEvidenceSnapshotId) REFERENCES dbo.AuditEvidenceSnapshots (AuditEvidenceSnapshotId),
        CONSTRAINT FK_AuditEvidenceSnapshotInventoryLinks_Inventory FOREIGN KEY (AzureInventorySnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceSnapshotInventoryLinks_Tenant_AuditSnapshot
        ON dbo.AuditEvidenceSnapshotInventoryLinks (TenantId, AuditEvidenceSnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshotItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceSnapshotItems
    (
        EvidenceRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceSnapshotItems PRIMARY KEY CLUSTERED,
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL,
        RequirementId           UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId         UNIQUEIDENTIFIER NULL,
        AzureResourceId         NVARCHAR(1024)    NULL,
        EvidenceType            NVARCHAR(128)     NOT NULL,
        CollectedUtc            DATETIME2         NOT NULL,
        CollectorVersion        NVARCHAR(64)      NOT NULL,
        NormalizedPointer       NVARCHAR(1024)    NULL,
        RawPointer              NVARCHAR(1024)    NULL,
        EvidenceHashSha256      VARBINARY(32)     NOT NULL,
        CollectionStatus        INT               NOT NULL,
        FreshnessStatus         INT               NOT NULL,
        Confidence              DECIMAL(5, 4)     NOT NULL,
        Summary                 NVARCHAR(2000)    NOT NULL,
        ProvenanceKind          INT               NOT NULL,
        SelectorVersion         NVARCHAR(64)      NOT NULL,
        AzureScope              NVARCHAR(512)     NULL,
        ApiQueryId              NVARCHAR(256)     NULL,
        CONSTRAINT FK_AuditEvidenceSnapshotItems_Snapshots FOREIGN KEY (AuditEvidenceSnapshotId) REFERENCES dbo.AuditEvidenceSnapshots (AuditEvidenceSnapshotId),
        CONSTRAINT FK_AuditEvidenceSnapshotItems_Requirements FOREIGN KEY (RequirementId) REFERENCES dbo.AuditEvidenceRequirements (RequirementId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceSnapshotItems_Tenant_AuditSnapshot
        ON dbo.AuditEvidenceSnapshotItems (TenantId, AuditEvidenceSnapshotId);
END;

GO

IF OBJECT_ID(N'dbo.AuditEvidenceBaselines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceBaselines
    (
        BaselineId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceBaselines PRIMARY KEY CLUSTERED,
        AssessmentId            UNIQUEIDENTIFIER NOT NULL,
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        Name                    NVARCHAR(256)     NOT NULL,
        DesignatedBy            NVARCHAR(256)     NOT NULL,
        DesignatedUtc           DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditEvidenceBaselines_Assessments FOREIGN KEY (AssessmentId) REFERENCES dbo.AuditAssessments (AssessmentId),
        CONSTRAINT FK_AuditEvidenceBaselines_Snapshots FOREIGN KEY (AuditEvidenceSnapshotId) REFERENCES dbo.AuditEvidenceSnapshots (AuditEvidenceSnapshotId),
        CONSTRAINT UQ_AuditEvidenceBaselines_Tenant_Assessment_Name UNIQUE (TenantId, AssessmentId, Name)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceBaselines_Tenant_Assessment
        ON dbo.AuditEvidenceBaselines (TenantId, AssessmentId, DesignatedUtc DESC);
END;
