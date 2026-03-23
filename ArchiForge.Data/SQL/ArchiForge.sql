/*
  ArchiForge — SQL Server consolidated schema (idempotent)

  Safe to run multiple times: skips existing tables/indexes/FKs; adds missing columns
  when tables already exist from an older baseline.

  Includes:
    - API / agent / commit trail (DbUp 001–007 equivalent)
    - Authority-chain + Dapper persistence + Decisioning (recommendations, advisory,
      digests, alerts, composite rules, policy packs) — same DDL as Persistence bootstrap.

  DbUp migrations remain the authoritative upgrade path for deployed apps; this script
  is for greenfield / manual / tooling. Persistence bootstrap executes this file (copy
  under ArchiForge.Persistence output as Scripts/ArchiForge.sql).

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

IF OBJECT_ID(N'dbo.ArchitectureRuns', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureRuns
    (
        RunId                  NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RequestId              NVARCHAR(64)  NOT NULL,
        Status                 NVARCHAR(50)  NOT NULL,
        CreatedUtc             DATETIME2     NOT NULL,
        CompletedUtc           DATETIME2     NULL,
        CurrentManifestVersion NVARCHAR(50)  NULL,
        ContextSnapshotId      NVARCHAR(64)  NULL,
        GraphSnapshotId        UNIQUEIDENTIFIER NULL,
        ArtifactBundleId       UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_ArchitectureRuns_Request FOREIGN KEY (RequestId)
            REFERENCES dbo.ArchitectureRequests (RequestId)
    );
END
GO

/* Additive columns if table predates migrations 005/006 */
IF OBJECT_ID(N'dbo.ArchitectureRuns', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ArchitectureRuns') AND name = N'ContextSnapshotId')
    ALTER TABLE dbo.ArchitectureRuns ADD ContextSnapshotId NVARCHAR(64) NULL;
GO

IF OBJECT_ID(N'dbo.ArchitectureRuns', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ArchitectureRuns') AND name = N'GraphSnapshotId')
    ALTER TABLE dbo.ArchitectureRuns ADD GraphSnapshotId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.ArchitectureRuns', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ArchitectureRuns') AND name = N'ArtifactBundleId')
    ALTER TABLE dbo.ArchitectureRuns ADD ArtifactBundleId UNIQUEIDENTIFIER NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ArchitectureRuns_Request')
   AND OBJECT_ID(N'dbo.ArchitectureRuns', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArchitectureRuns
        ADD CONSTRAINT FK_ArchitectureRuns_Request FOREIGN KEY (RequestId)
            REFERENCES dbo.ArchitectureRequests (RequestId);
END
GO

/* ---- Agents ---- */

IF OBJECT_ID(N'dbo.AgentTasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentTasks
    (
        TaskId             NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RunId              NVARCHAR(64)  NOT NULL,
        AgentType          NVARCHAR(50)  NOT NULL,
        Objective          NVARCHAR(MAX) NOT NULL,
        Status             NVARCHAR(50)  NOT NULL,
        CreatedUtc         DATETIME2     NOT NULL,
        CompletedUtc       DATETIME2     NULL,
        EvidenceBundleRef  NVARCHAR(64)  NULL,
        CONSTRAINT FK_AgentTasks_Run FOREIGN KEY (RunId)
            REFERENCES dbo.ArchitectureRuns (RunId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentTasks_Run')
   AND OBJECT_ID(N'dbo.AgentTasks', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentTasks ADD CONSTRAINT FK_AgentTasks_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentResults
    (
        ResultId   NVARCHAR(64)  NOT NULL PRIMARY KEY,
        TaskId     NVARCHAR(64)  NOT NULL,
        RunId      NVARCHAR(64)  NOT NULL,
        AgentType  NVARCHAR(50)  NOT NULL,
        Confidence FLOAT         NOT NULL,
        ResultJson NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentResults_Task FOREIGN KEY (TaskId) REFERENCES dbo.AgentTasks (TaskId),
        CONSTRAINT FK_AgentResults_Run FOREIGN KEY (RunId) REFERENCES dbo.ArchitectureRuns (RunId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentResults_Task')
   AND OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentResults ADD CONSTRAINT FK_AgentResults_Task FOREIGN KEY (TaskId)
        REFERENCES dbo.AgentTasks (TaskId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentResults_Run')
   AND OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentResults ADD CONSTRAINT FK_AgentResults_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

/* ---- Manifest / evidence ---- */

IF OBJECT_ID(N'dbo.GoldenManifestVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestVersions
    (
        ManifestVersion        NVARCHAR(50)  NOT NULL PRIMARY KEY,
        RunId                  NVARCHAR(64)  NOT NULL,
        SystemName             NVARCHAR(200) NOT NULL,
        ManifestJson           NVARCHAR(MAX) NOT NULL,
        ParentManifestVersion  NVARCHAR(50)  NULL,
        CreatedUtc             DATETIME2     NOT NULL,
        CONSTRAINT FK_GoldenManifestVersions_Run FOREIGN KEY (RunId)
            REFERENCES dbo.ArchitectureRuns (RunId),
        CONSTRAINT FK_GoldenManifestVersions_Parent FOREIGN KEY (ParentManifestVersion)
            REFERENCES dbo.GoldenManifestVersions (ManifestVersion)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifestVersions_Run')
   AND OBJECT_ID(N'dbo.GoldenManifestVersions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestVersions ADD CONSTRAINT FK_GoldenManifestVersions_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_GoldenManifestVersions_Parent')
   AND OBJECT_ID(N'dbo.GoldenManifestVersions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestVersions ADD CONSTRAINT FK_GoldenManifestVersions_Parent
        FOREIGN KEY (ParentManifestVersion) REFERENCES dbo.GoldenManifestVersions (ManifestVersion);
END
GO

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

IF OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DecisionTraces
    (
        TraceId          NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RunId            NVARCHAR(64)  NOT NULL,
        EventType        NVARCHAR(100) NOT NULL,
        EventDescription NVARCHAR(MAX) NOT NULL,
        EventJson        NVARCHAR(MAX) NOT NULL,
        CreatedUtc       DATETIME2     NOT NULL,
        CONSTRAINT FK_DecisionTraces_Run FOREIGN KEY (RunId) REFERENCES dbo.ArchitectureRuns (RunId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisionTraces_Run')
   AND OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DecisionTraces ADD CONSTRAINT FK_DecisionTraces_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentEvidencePackages
    (
        EvidencePackageId NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RunId             NVARCHAR(64)  NOT NULL,
        RequestId         NVARCHAR(64)  NOT NULL,
        SystemName        NVARCHAR(200) NOT NULL,
        Environment       NVARCHAR(50)  NOT NULL,
        CloudProvider     NVARCHAR(50)  NOT NULL,
        EvidenceJson      NVARCHAR(MAX) NOT NULL,
        CreatedUtc        DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentEvidencePackages_Run FOREIGN KEY (RunId)
            REFERENCES dbo.ArchitectureRuns (RunId),
        CONSTRAINT FK_AgentEvidencePackages_Request FOREIGN KEY (RequestId)
            REFERENCES dbo.ArchitectureRequests (RequestId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvidencePackages_Run')
   AND OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentEvidencePackages ADD CONSTRAINT FK_AgentEvidencePackages_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvidencePackages_Request')
   AND OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentEvidencePackages ADD CONSTRAINT FK_AgentEvidencePackages_Request
        FOREIGN KEY (RequestId) REFERENCES dbo.ArchitectureRequests (RequestId);
END
GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentExecutionTraces
    (
        TraceId        NVARCHAR(64)  NOT NULL PRIMARY KEY,
        RunId          NVARCHAR(64)  NOT NULL,
        TaskId         NVARCHAR(64)  NOT NULL,
        AgentType      NVARCHAR(50)  NOT NULL,
        ParseSucceeded BIT           NOT NULL,
        ErrorMessage   NVARCHAR(MAX) NULL,
        TraceJson      NVARCHAR(MAX) NOT NULL,
        CreatedUtc     DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentExecutionTraces_Run FOREIGN KEY (RunId)
            REFERENCES dbo.ArchitectureRuns (RunId),
        CONSTRAINT FK_AgentExecutionTraces_Task FOREIGN KEY (TaskId)
            REFERENCES dbo.AgentTasks (TaskId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentExecutionTraces_Run')
   AND OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentExecutionTraces ADD CONSTRAINT FK_AgentExecutionTraces_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentExecutionTraces_Task')
   AND OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentExecutionTraces ADD CONSTRAINT FK_AgentExecutionTraces_Task FOREIGN KEY (TaskId)
        REFERENCES dbo.AgentTasks (TaskId);
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
        CONSTRAINT FK_RunExportRecords_Run FOREIGN KEY (RunId) REFERENCES dbo.ArchitectureRuns (RunId)
    );
END
GO

IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'AnalysisRequestJson')
    ALTER TABLE dbo.RunExportRecords ADD AnalysisRequestJson NVARCHAR(MAX) NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedEvidence')
    ALTER TABLE dbo.RunExportRecords ADD IncludedEvidence BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedExecutionTraces')
    ALTER TABLE dbo.RunExportRecords ADD IncludedExecutionTraces BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedManifest')
    ALTER TABLE dbo.RunExportRecords ADD IncludedManifest BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedDiagram')
    ALTER TABLE dbo.RunExportRecords ADD IncludedDiagram BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedSummary')
    ALTER TABLE dbo.RunExportRecords ADD IncludedSummary BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedDeterminismCheck')
    ALTER TABLE dbo.RunExportRecords ADD IncludedDeterminismCheck BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'DeterminismIterations')
    ALTER TABLE dbo.RunExportRecords ADD DeterminismIterations INT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedManifestCompare')
    ALTER TABLE dbo.RunExportRecords ADD IncludedManifestCompare BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'CompareManifestVersion')
    ALTER TABLE dbo.RunExportRecords ADD CompareManifestVersion NVARCHAR(100) NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'IncludedAgentResultCompare')
    ALTER TABLE dbo.RunExportRecords ADD IncludedAgentResultCompare BIT NULL;
GO
IF OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RunExportRecords') AND name = N'CompareRunId')
    ALTER TABLE dbo.RunExportRecords ADD CompareRunId NVARCHAR(64) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RunExportRecords_Run')
   AND OBJECT_ID(N'dbo.RunExportRecords', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.RunExportRecords ADD CONSTRAINT FK_RunExportRecords_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

/* ---- ComparisonRecords ---- */

IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ComparisonRecords
    (
        ComparisonRecordId    NVARCHAR(64)  NOT NULL PRIMARY KEY,
        ComparisonType        NVARCHAR(100) NOT NULL,
        LeftRunId             NVARCHAR(64)  NULL,
        RightRunId            NVARCHAR(64)  NULL,
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
        CONSTRAINT FK_ComparisonRecords_LeftRun FOREIGN KEY (LeftRunId)
            REFERENCES dbo.ArchitectureRuns (RunId),
        CONSTRAINT FK_ComparisonRecords_RightRun FOREIGN KEY (RightRunId)
            REFERENCES dbo.ArchitectureRuns (RunId)
    );
END
GO

IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND name = N'Label')
    ALTER TABLE dbo.ComparisonRecords ADD Label NVARCHAR(256) NULL;
GO
IF OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND name = N'Tags')
    ALTER TABLE dbo.ComparisonRecords ADD Tags NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ComparisonRecords_LeftRun')
   AND OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ComparisonRecords ADD CONSTRAINT FK_ComparisonRecords_LeftRun FOREIGN KEY (LeftRunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ComparisonRecords_RightRun')
   AND OBJECT_ID(N'dbo.ComparisonRecords', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ComparisonRecords ADD CONSTRAINT FK_ComparisonRecords_RightRun FOREIGN KEY (RightRunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
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
        CONSTRAINT FK_DecisionNodes_Run FOREIGN KEY (RunId) REFERENCES dbo.ArchitectureRuns (RunId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisionNodes_Run')
   AND OBJECT_ID(N'dbo.DecisionNodes', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DecisionNodes ADD CONSTRAINT FK_DecisionNodes_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
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
        CONSTRAINT FK_AgentEvaluations_Run FOREIGN KEY (RunId)
            REFERENCES dbo.ArchitectureRuns (RunId),
        CONSTRAINT FK_AgentEvaluations_Task FOREIGN KEY (TargetAgentTaskId)
            REFERENCES dbo.AgentTasks (TaskId)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvaluations_Run')
   AND OBJECT_ID(N'dbo.AgentEvaluations', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentEvaluations ADD CONSTRAINT FK_AgentEvaluations_Run FOREIGN KEY (RunId)
        REFERENCES dbo.ArchitectureRuns (RunId);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AgentEvaluations_Task')
   AND OBJECT_ID(N'dbo.AgentEvaluations', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AgentEvaluations ADD CONSTRAINT FK_AgentEvaluations_Task FOREIGN KEY (TargetAgentTaskId)
        REFERENCES dbo.AgentTasks (TaskId);
END
GO

/* ---- Indexes (idempotent) ---- */

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ArchitectureRuns') AND i.name = N'IX_ArchitectureRuns_RequestId')
    CREATE NONCLUSTERED INDEX IX_ArchitectureRuns_RequestId ON dbo.ArchitectureRuns (RequestId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ArchitectureRuns') AND i.name = N'IX_ArchitectureRuns_CreatedUtc')
    CREATE NONCLUSTERED INDEX IX_ArchitectureRuns_CreatedUtc ON dbo.ArchitectureRuns (CreatedUtc DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ArchitectureRuns') AND i.name = N'IX_ArchitectureRuns_ContextSnapshotId')
    CREATE NONCLUSTERED INDEX IX_ArchitectureRuns_ContextSnapshotId ON dbo.ArchitectureRuns (ContextSnapshotId)
        WHERE ContextSnapshotId IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ArchitectureRuns') AND i.name = N'IX_ArchitectureRuns_GraphSnapshotId')
    CREATE NONCLUSTERED INDEX IX_ArchitectureRuns_GraphSnapshotId ON dbo.ArchitectureRuns (GraphSnapshotId)
        WHERE GraphSnapshotId IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentTasks') AND i.name = N'IX_AgentTasks_RunId')
    CREATE NONCLUSTERED INDEX IX_AgentTasks_RunId ON dbo.AgentTasks (RunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentTasks') AND i.name = N'IX_AgentTasks_RunId_AgentType')
    CREATE NONCLUSTERED INDEX IX_AgentTasks_RunId_AgentType ON dbo.AgentTasks (RunId, AgentType);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentResults') AND i.name = N'IX_AgentResults_RunId')
    CREATE NONCLUSTERED INDEX IX_AgentResults_RunId ON dbo.AgentResults (RunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentResults') AND i.name = N'IX_AgentResults_TaskId')
    CREATE NONCLUSTERED INDEX IX_AgentResults_TaskId ON dbo.AgentResults (TaskId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentResults') AND i.name = N'IX_AgentResults_CreatedUtc')
    CREATE NONCLUSTERED INDEX IX_AgentResults_CreatedUtc ON dbo.AgentResults (CreatedUtc DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.GoldenManifestVersions') AND i.name = N'IX_GoldenManifestVersions_RunId')
    CREATE NONCLUSTERED INDEX IX_GoldenManifestVersions_RunId ON dbo.GoldenManifestVersions (RunId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.DecisionTraces') AND i.name = N'IX_DecisionTraces_RunId')
    CREATE NONCLUSTERED INDEX IX_DecisionTraces_RunId ON dbo.DecisionTraces (RunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.DecisionTraces') AND i.name = N'IX_DecisionTraces_CreatedUtc')
    CREATE NONCLUSTERED INDEX IX_DecisionTraces_CreatedUtc ON dbo.DecisionTraces (CreatedUtc DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentEvidencePackages') AND i.name = N'IX_AgentEvidencePackages_RunId')
    CREATE NONCLUSTERED INDEX IX_AgentEvidencePackages_RunId ON dbo.AgentEvidencePackages (RunId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentExecutionTraces') AND i.name = N'IX_AgentExecutionTraces_RunId')
    CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_RunId ON dbo.AgentExecutionTraces (RunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentExecutionTraces') AND i.name = N'IX_AgentExecutionTraces_TaskId')
    CREATE NONCLUSTERED INDEX IX_AgentExecutionTraces_TaskId ON dbo.AgentExecutionTraces (TaskId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.RunExportRecords') AND i.name = N'IX_RunExportRecords_RunId')
    CREATE NONCLUSTERED INDEX IX_RunExportRecords_RunId ON dbo.RunExportRecords (RunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.RunExportRecords') AND i.name = N'IX_RunExportRecords_CreatedUtc')
    CREATE NONCLUSTERED INDEX IX_RunExportRecords_CreatedUtc ON dbo.RunExportRecords (CreatedUtc DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND i.name = N'IX_ComparisonRecords_LeftRunId')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_LeftRunId ON dbo.ComparisonRecords (LeftRunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND i.name = N'IX_ComparisonRecords_RightRunId')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_RightRunId ON dbo.ComparisonRecords (RightRunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND i.name = N'IX_ComparisonRecords_LeftExportRecordId')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_LeftExportRecordId ON dbo.ComparisonRecords (LeftExportRecordId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND i.name = N'IX_ComparisonRecords_RightExportRecordId')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_RightExportRecordId ON dbo.ComparisonRecords (RightExportRecordId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND i.name = N'IX_ComparisonRecords_ComparisonType_CreatedUtc')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_ComparisonType_CreatedUtc
        ON dbo.ComparisonRecords (ComparisonType, CreatedUtc DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.ComparisonRecords') AND i.name = N'IX_ComparisonRecords_Label')
    CREATE NONCLUSTERED INDEX IX_ComparisonRecords_Label ON dbo.ComparisonRecords (Label) WHERE Label IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.DecisionNodes') AND i.name = N'IX_DecisionNodes_RunId')
    CREATE NONCLUSTERED INDEX IX_DecisionNodes_RunId ON dbo.DecisionNodes (RunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.DecisionNodes') AND i.name = N'IX_DecisionNodes_CreatedUtc')
    CREATE NONCLUSTERED INDEX IX_DecisionNodes_CreatedUtc ON dbo.DecisionNodes (CreatedUtc DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentEvaluations') AND i.name = N'IX_AgentEvaluations_RunId')
    CREATE NONCLUSTERED INDEX IX_AgentEvaluations_RunId ON dbo.AgentEvaluations (RunId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes i INNER JOIN sys.tables t ON i.object_id = t.object_id
               WHERE t.object_id = OBJECT_ID(N'dbo.AgentEvaluations') AND i.name = N'IX_AgentEvaluations_TargetAgentTaskId')
    CREATE NONCLUSTERED INDEX IX_AgentEvaluations_TargetAgentTaskId ON dbo.AgentEvaluations (TargetAgentTaskId);
GO

/* ---- Authority / Dapper persistence + Decisioning (GUID Runs; not ArchitectureRuns) ---- */
/*
  DecisioningTraces is used instead of DecisionTraces because dbo.DecisionTraces already
  exists for the API/commit trail above.
*/

IF OBJECT_ID('dbo.Runs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Runs
    (
        RunId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ProjectId NVARCHAR(200) NOT NULL,
        Description NVARCHAR(4000) NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ContextSnapshotId UNIQUEIDENTIFIER NULL,
        GraphSnapshotId UNIQUEIDENTIFIER NULL,
        FindingsSnapshotId UNIQUEIDENTIFIER NULL,
        GoldenManifestId UNIQUEIDENTIFIER NULL,
        DecisionTraceId UNIQUEIDENTIFIER NULL,
        ArtifactBundleId UNIQUEIDENTIFIER NULL
    );

    CREATE INDEX IX_Runs_ProjectId_CreatedUtc
        ON dbo.Runs(ProjectId, CreatedUtc DESC);
END;
GO

IF OBJECT_ID('dbo.ContextSnapshots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContextSnapshots
    (
        SnapshotId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        ProjectId NVARCHAR(200) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CanonicalObjectsJson NVARCHAR(MAX) NOT NULL,
        DeltaSummary NVARCHAR(MAX) NULL,
        WarningsJson NVARCHAR(MAX) NOT NULL,
        ErrorsJson NVARCHAR(MAX) NOT NULL,
        SourceHashesJson NVARCHAR(MAX) NOT NULL
    );

    CREATE INDEX IX_ContextSnapshots_ProjectId_CreatedUtc
        ON dbo.ContextSnapshots(ProjectId, CreatedUtc DESC);

    CREATE INDEX IX_ContextSnapshots_RunId
        ON dbo.ContextSnapshots(RunId);
END;
GO

IF OBJECT_ID('dbo.GraphSnapshots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GraphSnapshots
    (
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ContextSnapshotId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        NodesJson NVARCHAR(MAX) NOT NULL,
        EdgesJson NVARCHAR(MAX) NOT NULL,
        WarningsJson NVARCHAR(MAX) NOT NULL
    );

    CREATE INDEX IX_GraphSnapshots_RunId
        ON dbo.GraphSnapshots(RunId);

    CREATE INDEX IX_GraphSnapshots_ContextSnapshotId
        ON dbo.GraphSnapshots(ContextSnapshotId);
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
        CreatedUtc DATETIME2 NOT NULL,
        FindingsJson NVARCHAR(MAX) NOT NULL
    );

    CREATE INDEX IX_FindingsSnapshots_RunId
        ON dbo.FindingsSnapshots(RunId);

    CREATE INDEX IX_FindingsSnapshots_ContextSnapshotId
        ON dbo.FindingsSnapshots(ContextSnapshotId);

    CREATE INDEX IX_FindingsSnapshots_GraphSnapshotId
        ON dbo.FindingsSnapshots(GraphSnapshotId);
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
        NotesJson NVARCHAR(MAX) NOT NULL
    );

    CREATE INDEX IX_DecisioningTraces_RunId
        ON dbo.DecisioningTraces(RunId);
END;
GO

IF OBJECT_ID('dbo.GoldenManifests', 'U') IS NULL
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
        ProvenanceJson NVARCHAR(MAX) NOT NULL
    );

    CREATE INDEX IX_GoldenManifests_RunId
        ON dbo.GoldenManifests(RunId);
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
        ArtifactsJson NVARCHAR(MAX) NOT NULL,
        TraceJson NVARCHAR(MAX) NOT NULL
    );

    CREATE INDEX IX_ArtifactBundles_RunId
        ON dbo.ArtifactBundles(RunId);

    CREATE INDEX IX_ArtifactBundles_ManifestId
        ON dbo.ArtifactBundles(ManifestId);
END;
GO

IF COL_LENGTH('dbo.GoldenManifests', 'ComplianceJson') IS NULL
BEGIN
    ALTER TABLE dbo.GoldenManifests
        ADD ComplianceJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_GoldenManifests_ComplianceJson DEFAULT (N'{}');
END;
GO

/* --- Multi-tenant scope (Tenant / Workspace / Project GUID) --- */

IF COL_LENGTH('dbo.Runs', 'TenantId') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD TenantId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_Runs_TenantId DEFAULT ('11111111-1111-1111-1111-111111111111');
END;
GO

IF COL_LENGTH('dbo.Runs', 'WorkspaceId') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD WorkspaceId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_Runs_WorkspaceId DEFAULT ('22222222-2222-2222-2222-222222222222');
END;
GO

IF COL_LENGTH('dbo.Runs', 'ScopeProjectId') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD ScopeProjectId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_Runs_ScopeProjectId DEFAULT ('33333333-3333-3333-3333-333333333333');
END;
GO

IF COL_LENGTH('dbo.DecisioningTraces', 'TenantId') IS NULL
BEGIN
    ALTER TABLE dbo.DecisioningTraces ADD TenantId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_DecisioningTraces_TenantId DEFAULT ('11111111-1111-1111-1111-111111111111');
END;
GO

IF COL_LENGTH('dbo.DecisioningTraces', 'WorkspaceId') IS NULL
BEGIN
    ALTER TABLE dbo.DecisioningTraces ADD WorkspaceId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_DecisioningTraces_WorkspaceId DEFAULT ('22222222-2222-2222-2222-222222222222');
END;
GO

IF COL_LENGTH('dbo.DecisioningTraces', 'ProjectId') IS NULL
BEGIN
    ALTER TABLE dbo.DecisioningTraces ADD ProjectId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_DecisioningTraces_ProjectId DEFAULT ('33333333-3333-3333-3333-333333333333');
END;
GO

IF COL_LENGTH('dbo.GoldenManifests', 'TenantId') IS NULL
BEGIN
    ALTER TABLE dbo.GoldenManifests ADD TenantId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_GoldenManifests_TenantId DEFAULT ('11111111-1111-1111-1111-111111111111');
END;
GO

IF COL_LENGTH('dbo.GoldenManifests', 'WorkspaceId') IS NULL
BEGIN
    ALTER TABLE dbo.GoldenManifests ADD WorkspaceId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_GoldenManifests_WorkspaceId DEFAULT ('22222222-2222-2222-2222-222222222222');
END;
GO

IF COL_LENGTH('dbo.GoldenManifests', 'ProjectId') IS NULL
BEGIN
    ALTER TABLE dbo.GoldenManifests ADD ProjectId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_GoldenManifests_ProjectId DEFAULT ('33333333-3333-3333-3333-333333333333');
END;
GO

IF COL_LENGTH('dbo.ArtifactBundles', 'TenantId') IS NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundles ADD TenantId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_ArtifactBundles_TenantId DEFAULT ('11111111-1111-1111-1111-111111111111');
END;
GO

IF COL_LENGTH('dbo.ArtifactBundles', 'WorkspaceId') IS NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundles ADD WorkspaceId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_ArtifactBundles_WorkspaceId DEFAULT ('22222222-2222-2222-2222-222222222222');
END;
GO

IF COL_LENGTH('dbo.ArtifactBundles', 'ProjectId') IS NULL
BEGIN
    ALTER TABLE dbo.ArtifactBundles ADD ProjectId UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_ArtifactBundles_ProjectId DEFAULT ('33333333-3333-3333-3333-333333333333');
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
        CorrelationId NVARCHAR(200) NULL
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvents_Scope_OccurredUtc
        ON dbo.AuditEvents (TenantId, WorkspaceId, ProjectId, OccurredUtc DESC);
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
        CreatedUtc DATETIME2 NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_ProvenanceSnapshots_Scope_Run
        ON dbo.ProvenanceSnapshots (TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc DESC);
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
        LastUpdatedUtc DATETIME2 NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_ConversationThreads_Scope
        ON dbo.ConversationThreads (TenantId, WorkspaceId, ProjectId, LastUpdatedUtc DESC);
END;
GO

IF OBJECT_ID('dbo.ConversationMessages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConversationMessages
    (
        MessageId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ThreadId UNIQUEIDENTIFIER NOT NULL,
        Role NVARCHAR(50) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        MetadataJson NVARCHAR(MAX) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_ConversationMessages_ThreadId_CreatedUtc
        ON dbo.ConversationMessages (ThreadId, CreatedUtc ASC);
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
        SupportingArtifactIdsJson NVARCHAR(MAX) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_RecommendationRecords_Scope_Run
        ON dbo.RecommendationRecords (TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_RecommendationRecords_Scope_Status
        ON dbo.RecommendationRecords (TenantId, WorkspaceId, ProjectId, Status, LastUpdatedUtc DESC);
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
        ProfileJson NVARCHAR(MAX) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_RecommendationLearningProfiles_Scope_GeneratedUtc
        ON dbo.RecommendationLearningProfiles (TenantId, WorkspaceId, ProjectId, GeneratedUtc DESC);
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
        NextRunUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_AdvisoryScanSchedules_Scope_Enabled_NextRun
        ON dbo.AdvisoryScanSchedules (TenantId, WorkspaceId, ProjectId, IsEnabled, NextRunUtc);
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
        ErrorMessage NVARCHAR(MAX) NULL
    );

    CREATE NONCLUSTERED INDEX IX_AdvisoryScanExecutions_Schedule_StartedUtc
        ON dbo.AdvisoryScanExecutions (ScheduleId, StartedUtc DESC);
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
        MetadataJson NVARCHAR(MAX) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureDigests_Scope_GeneratedUtc
        ON dbo.ArchitectureDigests (TenantId, WorkspaceId, ProjectId, GeneratedUtc DESC);
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
        MetadataJson NVARCHAR(MAX) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_DigestSubscriptions_Scope_Enabled
        ON dbo.DigestSubscriptions (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC);
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
        Destination NVARCHAR(1000) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_DigestDeliveryAttempts_DigestId_AttemptedUtc
        ON dbo.DigestDeliveryAttempts (DigestId, AttemptedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_DigestDeliveryAttempts_SubscriptionId_AttemptedUtc
        ON dbo.DigestDeliveryAttempts (SubscriptionId, AttemptedUtc DESC);
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
        CreatedUtc DATETIME2 NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_AlertRules_Scope_Enabled
        ON dbo.AlertRules (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC);
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
        DeduplicationKey NVARCHAR(500) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_AlertRecords_Scope_Status_CreatedUtc
        ON dbo.AlertRecords (TenantId, WorkspaceId, ProjectId, Status, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_AlertRecords_DeduplicationKey
        ON dbo.AlertRecords (DeduplicationKey);
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
        MetadataJson NVARCHAR(MAX) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_AlertRoutingSubscriptions_Scope_Enabled
        ON dbo.AlertRoutingSubscriptions (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC);
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
        RetryCount INT NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_AlertDeliveryAttempts_AlertId_AttemptedUtc
        ON dbo.AlertDeliveryAttempts (AlertId, AttemptedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_AlertDeliveryAttempts_RoutingSubscriptionId_AttemptedUtc
        ON dbo.AlertDeliveryAttempts (RoutingSubscriptionId, AttemptedUtc DESC);
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
        CreatedUtc DATETIME2 NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_CompositeAlertRules_Scope_Enabled
        ON dbo.CompositeAlertRules (TenantId, WorkspaceId, ProjectId, IsEnabled, CreatedUtc DESC);
END;
GO

IF OBJECT_ID('dbo.CompositeAlertRuleConditions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CompositeAlertRuleConditions
    (
        ConditionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CompositeAlertRuleConditions PRIMARY KEY,
        CompositeRuleId UNIQUEIDENTIFIER NOT NULL,
        MetricType NVARCHAR(100) NOT NULL,
        [Operator] NVARCHAR(50) NOT NULL,
        ThresholdValue DECIMAL(18, 4) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_CompositeAlertRuleConditions_CompositeRuleId
        ON dbo.CompositeAlertRuleConditions (CompositeRuleId);
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
        CurrentVersion NVARCHAR(50) NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_PolicyPacks_Scope_Status
        ON dbo.PolicyPacks (TenantId, WorkspaceId, ProjectId, Status, CreatedUtc DESC);
END;
GO

IF OBJECT_ID('dbo.PolicyPackVersions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyPackVersions
    (
        PolicyPackVersionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PolicyPackVersions PRIMARY KEY,
        PolicyPackId UNIQUEIDENTIFIER NOT NULL,
        [Version] NVARCHAR(50) NOT NULL,
        ContentJson NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        IsPublished BIT NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_PolicyPackVersions_PolicyPackId_Version
        ON dbo.PolicyPackVersions (PolicyPackId, [Version]);
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
        AssignedUtc DATETIME2 NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_PolicyPackAssignments_Scope_Enabled
        ON dbo.PolicyPackAssignments (TenantId, WorkspaceId, ProjectId, IsEnabled, AssignedUtc DESC);
END;
GO

/* Existing deployments created before ScopeLevel/IsPinned (DbUp 015 baseline). */
IF OBJECT_ID('dbo.PolicyPackAssignments', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.PolicyPackAssignments', 'ScopeLevel') IS NULL
    BEGIN
        ALTER TABLE dbo.PolicyPackAssignments ADD ScopeLevel NVARCHAR(50) NOT NULL
            CONSTRAINT DF_PolicyPackAssignments_ScopeLevel DEFAULT (N'Project');
    END;

    IF COL_LENGTH('dbo.PolicyPackAssignments', 'IsPinned') IS NULL
    BEGIN
        ALTER TABLE dbo.PolicyPackAssignments ADD IsPinned BIT NOT NULL
            CONSTRAINT DF_PolicyPackAssignments_IsPinned DEFAULT (0);
    END;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_PolicyPackAssignments_ScopeLevel_AssignedUtc'
      AND object_id = OBJECT_ID(N'dbo.PolicyPackAssignments'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_PolicyPackAssignments_ScopeLevel_AssignedUtc
        ON dbo.PolicyPackAssignments (TenantId, WorkspaceId, ProjectId, ScopeLevel, AssignedUtc DESC);
END;
GO
