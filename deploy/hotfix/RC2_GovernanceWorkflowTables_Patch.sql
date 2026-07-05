/*
  -- Historical RC2 hotfix — Governance workflow tables (production patch)
  -- Superseded by main-line DbUp migrations; retained for audit trail only.

  PURPOSE
    Repairs the failure observed on the RC2 deploy:
        Invalid object name 'dbo.GovernanceApprovalRequests'
    The consolidated bootstrap script (ArchLucid.sql) historically relied on DbUp /
    the greenfield baseline to create the three governance workflow tables before it
    ran its ALTER / CREATE INDEX "parity" blocks. On a catalog where those tables were
    never created, the unguarded CREATE INDEX blocks bound to a non-existent table and
    failed. This script creates the missing tables (full current shape) so the API and
    the bootstrap script can proceed.

  SCOPE
    Tenant / product catalog (the catalog the API persists review data into). Run it
    against the SAME database that produced the "Invalid object name" error.

  SAFETY / IDEMPOTENCY
    - Re-runnable: tables are created only IF missing; columns added only IF missing;
      indexes created only IF missing; the FK to dbo.Tenants is added only IF dbo.Tenants
      exists and the constraint is absent.
    - No data is modified or deleted. The tenant/workspace/project scope columns are
      created NOT NULL on a freshly created (empty) table; on a pre-existing partial
      table they are added as NULL and left for the standard migration chain to tighten
      after backfill (this script never forces a NOT NULL conversion on populated tables).
    - Wrap in an explicit transaction at the prompt if your change process requires it;
      every statement here is individually guarded.

  REFERENCE
    Mirrors ArchLucid.Persistence/Migrations/038_GovernanceWorkflow.sql (base shape) plus
    parity migrations 058 (SLA), 130 (actor keys), 118 (tenant scope) and their indexes.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ============================================================================
   1. Base tables (DbUp 038 parity) — create only when missing
   ============================================================================ */

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceApprovalRequests
    (
        ApprovalRequestId NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId             NVARCHAR(64)     NOT NULL,
        ManifestVersion   NVARCHAR(128)    NOT NULL,
        SourceEnvironment NVARCHAR(32)     NOT NULL,
        TargetEnvironment NVARCHAR(32)     NOT NULL,
        Status            NVARCHAR(32)     NOT NULL,
        RequestedBy       NVARCHAR(200)    NOT NULL,
        ReviewedBy        NVARCHAR(200)    NULL,
        RequestComment    NVARCHAR(MAX)    NULL,
        ReviewComment     NVARCHAR(MAX)    NULL,
        RequestedUtc      DATETIME2        NOT NULL,
        ReviewedUtc       DATETIME2        NULL,
        -- DbUp 058 parity (SLA tracking)
        SlaDeadlineUtc        DATETIME2    NULL,
        SlaBreachNotifiedUtc  DATETIME2    NULL,
        -- DbUp 130 parity (canonical JWT actor keys)
        RequestedByActorKey   NVARCHAR(256) NULL,
        ReviewedByActorKey    NVARCHAR(256) NULL,
        -- DbUp 118 parity (tenant/workspace/project scope) — NOT NULL on a fresh, empty table
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL
    );
END
GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernancePromotionRecords
    (
        PromotionRecordId NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId             NVARCHAR(64)     NOT NULL,
        ManifestVersion   NVARCHAR(128)    NOT NULL,
        SourceEnvironment NVARCHAR(32)     NOT NULL,
        TargetEnvironment NVARCHAR(32)     NOT NULL,
        PromotedBy        NVARCHAR(200)    NOT NULL,
        PromotedUtc       DATETIME2        NOT NULL,
        ApprovalRequestId NVARCHAR(64)     NULL,
        Notes             NVARCHAR(MAX)    NULL,
        -- DbUp 118 parity (tenant/workspace/project scope)
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL
    );
END
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GovernanceEnvironmentActivations
    (
        ActivationId    NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId           NVARCHAR(64)     NOT NULL,
        ManifestVersion NVARCHAR(128)    NOT NULL,
        Environment     NVARCHAR(32)     NOT NULL,
        IsActive        BIT              NOT NULL,
        ActivatedUtc    DATETIME2        NOT NULL,
        -- DbUp 118 parity (tenant/workspace/project scope)
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId     UNIQUEIDENTIFIER NOT NULL,
        ProjectId       UNIQUEIDENTIFIER NOT NULL
    );
END
GO

/* ============================================================================
   2. Column top-ups for a pre-existing PARTIAL table (added NULL; safe on data)
   ============================================================================ */

-- GovernanceApprovalRequests: SLA + actor-key + scope columns
IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'SlaDeadlineUtc') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD SlaDeadlineUtc DATETIME2 NULL;
GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'SlaBreachNotifiedUtc') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD SlaBreachNotifiedUtc DATETIME2 NULL;
GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'RequestedByActorKey') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD RequestedByActorKey NVARCHAR(256) NULL;
GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'ReviewedByActorKey') IS NULL
    ALTER TABLE dbo.GovernanceApprovalRequests ADD ReviewedByActorKey NVARCHAR(256) NULL;
GO

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

-- GovernancePromotionRecords: scope columns
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

-- GovernanceEnvironmentActivations: scope columns
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

/* ============================================================================
   3. Indexes (all guarded on table + index existence)
   ============================================================================ */

-- 038 base indexes
IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceApprovalRequests_RunId'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_RunId
        ON dbo.GovernanceApprovalRequests (RunId);
GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernancePromotionRecords_RunId'
                     AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
    CREATE NONCLUSTERED INDEX IX_GovernancePromotionRecords_RunId
        ON dbo.GovernancePromotionRecords (RunId);
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceEnvironmentActivations_Environment_IsActive'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_Environment_IsActive
        ON dbo.GovernanceEnvironmentActivations (Environment, IsActive);
GO

-- 059 SLA / status indexes (the blocks that originally failed)
IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceApprovalRequests_PendingSlaBreached'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_PendingSlaBreached
        ON dbo.GovernanceApprovalRequests (SlaDeadlineUtc ASC)
        INCLUDE (ApprovalRequestId, RunId, RequestedBy, Status)
        WHERE SlaDeadlineUtc IS NOT NULL AND SlaBreachNotifiedUtc IS NULL;
GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceApprovalRequests_Status_RequestedUtc'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_Status_RequestedUtc
        ON dbo.GovernanceApprovalRequests (Status, RequestedUtc DESC)
        INCLUDE (RunId, ManifestVersion, SourceEnvironment, TargetEnvironment);
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceEnvironmentActivations_RunId_ActivatedUtc'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_RunId_ActivatedUtc
        ON dbo.GovernanceEnvironmentActivations (RunId, ActivatedUtc DESC);
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceEnvironmentActivations_Environment_ActivatedUtc'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_Environment_ActivatedUtc
        ON dbo.GovernanceEnvironmentActivations (Environment, ActivatedUtc DESC)
        INCLUDE (RunId, ManifestVersion, IsActive);
GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernancePromotionRecords_RunId_PromotedUtc'
                     AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
    CREATE NONCLUSTERED INDEX IX_GovernancePromotionRecords_RunId_PromotedUtc
        ON dbo.GovernancePromotionRecords (RunId, PromotedUtc DESC);
GO

-- 118 scope indexes
IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceApprovalRequests_Scope_RequestedUtc'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    CREATE NONCLUSTERED INDEX IX_GovernanceApprovalRequests_Scope_RequestedUtc
        ON dbo.GovernanceApprovalRequests (TenantId, WorkspaceId, ProjectId, RequestedUtc DESC)
        INCLUDE (ApprovalRequestId, RunId, Status, ManifestVersion, SourceEnvironment, TargetEnvironment);
GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernancePromotionRecords_Scope_PromotedUtc'
                     AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
    CREATE NONCLUSTERED INDEX IX_GovernancePromotionRecords_Scope_PromotedUtc
        ON dbo.GovernancePromotionRecords (TenantId, WorkspaceId, ProjectId, PromotedUtc DESC)
        INCLUDE (PromotionRecordId, RunId, ManifestVersion, SourceEnvironment, TargetEnvironment);
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = N'IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc'
                     AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    CREATE NONCLUSTERED INDEX IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc
        ON dbo.GovernanceEnvironmentActivations (TenantId, WorkspaceId, ProjectId, ActivatedUtc DESC)
        INCLUDE (ActivationId, RunId, Environment, IsActive, ManifestVersion);
GO

/* ============================================================================
   4. Foreign keys to dbo.Tenants — only when the Tenants table exists in this catalog
   ============================================================================ */

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'TenantId') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE name = N'FK_GovernanceApprovalRequests_Tenants'
                     AND parent_object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    ALTER TABLE dbo.GovernanceApprovalRequests
        ADD CONSTRAINT FK_GovernanceApprovalRequests_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);
GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'TenantId') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE name = N'FK_GovernancePromotionRecords_Tenants'
                     AND parent_object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
    ALTER TABLE dbo.GovernancePromotionRecords
        ADD CONSTRAINT FK_GovernancePromotionRecords_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);
GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'TenantId') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE name = N'FK_GovernanceEnvironmentActivations_Tenants'
                     AND parent_object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    ALTER TABLE dbo.GovernanceEnvironmentActivations
        ADD CONSTRAINT FK_GovernanceEnvironmentActivations_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id);
GO

/* ============================================================================
   5. Verification (optional) — confirms all three tables now exist
   ============================================================================ */

SELECT
    t.name AS TableName,
    (SELECT COUNT(*) FROM sys.indexes i WHERE i.object_id = t.object_id AND i.index_id > 0) AS IndexCount
FROM sys.tables AS t
WHERE t.name IN (
    N'GovernanceApprovalRequests',
    N'GovernancePromotionRecords',
    N'GovernanceEnvironmentActivations')
ORDER BY t.name;
GO
