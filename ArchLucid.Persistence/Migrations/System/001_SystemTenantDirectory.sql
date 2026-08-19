/*
  System-plane 001: authoritative dbo.Tenants row shape for tenant directory + commercial metadata.
  Idempotent CREATE for greenfield system catalogs (RunSystem). Shared SingleCatalog hosts also receive later
  incremental tenant migrations (069+) which extend dbo.Tenants when this CREATE was skipped.
*/
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
