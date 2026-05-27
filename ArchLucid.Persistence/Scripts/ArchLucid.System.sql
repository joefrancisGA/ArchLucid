/*
  ArchLucid — SQL Server consolidated schema (system / control-plane catalog only)

  DOCUMENTATION
    Full guide: docs/library/SQL_SCRIPTS.md (DbUp vs this file; system-plane migrations).

  EXECUTION
    - After DatabaseMigrator.RunSystem, SqlSchemaBootstrapper may run this file (idempotent greenfield align).
    - Manual / SSMS: run as-is; requires SQL Server 2014+ style inline INDEX on CREATE TABLE.

  SEMANTICS
    - Safe to run multiple times: CREATE TABLE only if missing (IF OBJECT_ID … IS NULL).
    - Brownfield upgrades remain authoritative via DbUp scripts under Migrations/System/.

  CONTENT
    - dbo.Tenants (tenant directory + commercial metadata)
    - dbo.TenantDatabaseBindings + dbo.TenantDatabaseProvisioningJobs
    - dbo.WarmTenantCatalogStandby (warm catalog pool — TB-018)

  SET ANSI_NULLS ON;
  SET QUOTED_IDENTIFIER ON;
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tenants
    (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Tenants PRIMARY KEY,
        Name             NVARCHAR(200)    NOT NULL,
        Slug             NVARCHAR(100)    NOT NULL,
        Tier             NVARCHAR(32)     NOT NULL CONSTRAINT DF_Tenants_Tier DEFAULT N'Standard',
        CreatedUtc       DATETIMEOFFSET   NOT NULL CONSTRAINT DF_Tenants_CreatedUtc DEFAULT SYSUTCDATETIME(),
        SuspendedUtc     DATETIMEOFFSET   NULL,
        EntraTenantId    UNIQUEIDENTIFIER NULL,
        TrialStartUtc    DATETIMEOFFSET   NULL,
        TrialExpiresUtc  DATETIMEOFFSET   NULL,
        TrialRunsLimit   INT              NULL,
        TrialRunsUsed    INT              NOT NULL CONSTRAINT DF_Tenants_TrialRunsUsed DEFAULT 0,
        TrialSeatsLimit  INT              NULL,
        TrialSeatsUsed   INT              NOT NULL CONSTRAINT DF_Tenants_TrialSeatsUsed DEFAULT 0,
        TrialStatus      NVARCHAR(32)     NULL,
        TrialSampleRunId UNIQUEIDENTIFIER NULL,
        TrialArchitecturePreseedEnqueuedUtc DATETIMEOFFSET NULL,
        TrialWelcomeRunId UNIQUEIDENTIFIER NULL,
        TrialFirstManifestCommittedUtc DATETIMEOFFSET NULL,
        BaselineReviewCycleHours DECIMAL(9, 2) NULL,
        BaselineReviewCycleSource NVARCHAR(256) NULL,
        BaselineReviewCycleCapturedUtc DATETIMEOFFSET(7) NULL,
        BaselineManualPrepHoursPerReview DECIMAL(9, 2) NULL,
        BaselinePeoplePerReview INT NULL,
        BaselineManualPrepCapturedUtc DATETIMEOFFSET(7) NULL,
        CompanySize                          NVARCHAR(30) NULL,
        ArchitectureTeamSize                 INT NULL,
        IndustryVertical                     NVARCHAR(100) NULL,
        IndustryVerticalOther                NVARCHAR(200) NULL,
        EnterpriseSeatsLimit INT NULL,
        EnterpriseSeatsUsed INT NOT NULL CONSTRAINT DF_Tenants_EnterpriseSeatsUsed113 DEFAULT (0),
        CONSTRAINT UQ_Tenants_Slug UNIQUE (Slug)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Tenants_BaselineReviewCycleHours_Positive'
      AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_BaselineReviewCycleHours_Positive
        CHECK (BaselineReviewCycleHours IS NULL OR BaselineReviewCycleHours > 0);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Tenants_BaselineManualPrepHoursPerReview_Positive'
      AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_BaselineManualPrepHoursPerReview_Positive
        CHECK (BaselineManualPrepHoursPerReview IS NULL OR BaselineManualPrepHoursPerReview > 0);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Tenants_BaselinePeoplePerReview_Positive'
      AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_Tenants_BaselinePeoplePerReview_Positive
        CHECK (BaselinePeoplePerReview IS NULL OR BaselinePeoplePerReview > 0);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_ArchLucid_SystemTenants_ArchitectureTeamSize_Positive'
      AND parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U'))
BEGIN
    ALTER TABLE dbo.Tenants ADD CONSTRAINT CK_ArchLucid_SystemTenants_ArchitectureTeamSize_Positive
        CHECK (ArchitectureTeamSize IS NULL OR ArchitectureTeamSize > 0);
END;
GO

IF OBJECT_ID(N'dbo.TenantDatabaseBindings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantDatabaseBindings
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantDatabaseBindings PRIMARY KEY,
        SqlLogicalDatabaseName  NVARCHAR(128)    NOT NULL,
        ProvisioningState       TINYINT          NOT NULL CONSTRAINT DF_TenantDatabaseBindings_State DEFAULT (0),
        LastError               NVARCHAR(4000)   NULL,
        CreatedUtc              DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantDatabaseBindings_Created DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc              DATETIMEOFFSET   NOT NULL CONSTRAINT DF_TenantDatabaseBindings_Updated DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_TenantDatabaseBindings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE NONCLUSTERED INDEX IX_TenantDatabaseBindings_ProvisioningState
        ON dbo.TenantDatabaseBindings (ProvisioningState)
        INCLUDE (SqlLogicalDatabaseName, UpdatedUtc);
END;
GO

IF OBJECT_ID(N'dbo.TenantDatabaseProvisioningJobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantDatabaseProvisioningJobs
    (
        JobId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_TenantDatabaseProvisioningJobs_Job DEFAULT NEWSEQUENTIALID(),
        TenantId       UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_TenantDatabaseProvisioningJobs PRIMARY KEY (JobId),
        AttemptCount   INT              NOT NULL CONSTRAINT DF_TenantDatabaseProvisioningJobs_Attempts DEFAULT (0),
        LastAttemptUtc DATETIMEOFFSET   NULL,
        CorrelationId  NVARCHAR(200)    NULL,
        CONSTRAINT FK_TenantDatabaseProvisioningJobs_Bindings FOREIGN KEY (TenantId) REFERENCES dbo.TenantDatabaseBindings (TenantId)
    );

    CREATE NONCLUSTERED INDEX IX_TenantDatabaseProvisioningJobs_TenantId
        ON dbo.TenantDatabaseProvisioningJobs (TenantId);
END;
GO

IF OBJECT_ID(N'dbo.WarmTenantCatalogStandby', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WarmTenantCatalogStandby
    (
        StandbyId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_WarmTenantCatalogStandby PRIMARY KEY,
        SqlLogicalDatabaseName  NVARCHAR(128)    NOT NULL,
        SchemaReadyUtc          DATETIMEOFFSET   NOT NULL CONSTRAINT DF_WarmTenantCatalogStandby_SchemaReady DEFAULT (SYSUTCDATETIME()),
        CreatedUtc              DATETIMEOFFSET   NOT NULL CONSTRAINT DF_WarmTenantCatalogStandby_Created DEFAULT (SYSUTCDATETIME()),
        ClaimedUtc              DATETIMEOFFSET   NULL,
        CONSTRAINT UQ_WarmTenantCatalogStandby_DbName UNIQUE (SqlLogicalDatabaseName)
    );

    CREATE NONCLUSTERED INDEX IX_WarmTenantCatalogStandby_Unclaimed
        ON dbo.WarmTenantCatalogStandby (ClaimedUtc, CreatedUtc)
        INCLUDE (SqlLogicalDatabaseName)
        WHERE ClaimedUtc IS NULL;
END;
GO
