/*
  273: Coverage foundation — QualityDimension on PolicyPacks + CoverageAssignments (Phase 1).

  See docs/architecture/architecture_quality_policy_engine_assessment.md (C.5, C.15).
  RLS: not applied — scope enforced in repository queries via ScopeContext / Runs join.
*/
IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'QualityDimension') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPacks
        ADD QualityDimension NVARCHAR(64) NULL;
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
                N'SustainabilityAndResourceEfficiency'));
END;
GO

IF OBJECT_ID(N'dbo.CoverageAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CoverageAssignments
    (
        CoverageAssignmentId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId          UNIQUEIDENTIFIER NOT NULL,
        ProjectId            UNIQUEIDENTIFIER NOT NULL,
        RunId                UNIQUEIDENTIFIER NULL,
        PolicyPackId         UNIQUEIDENTIFIER NOT NULL,
        PolicyPackVersion    NVARCHAR(50)     NOT NULL,
        CoverageType         NVARCHAR(32)     NOT NULL,
        SelectionState       NVARCHAR(32)     NOT NULL,
        RecommendationConfidence NVARCHAR(16) NULL,
        RecommendationTrigger    NVARCHAR(200) NULL,
        RecommendationRationale  NVARCHAR(2000) NULL,
        TriggeringEvidenceRef    NVARCHAR(200) NULL,
        ExclusionReason          NVARCHAR(2000) NULL,
        ActorUserId          NVARCHAR(128)    NOT NULL,
        CreatedUtc           DATETIME2(7)     NOT NULL,
        EvaluationVersion    NVARCHAR(50)     NOT NULL,
        CONSTRAINT FK_CoverageAssignments_PolicyPacks
            FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId),
        CONSTRAINT FK_CoverageAssignments_Runs
            FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId),
        CONSTRAINT CK_CoverageAssignments_CoverageType CHECK (CoverageType IN (
            N'ProviderNeutralBaseline', N'OrganizationRequired', N'PlatformOverlay',
            N'ContextualRecommended', N'AdditionalOptional')),
        CONSTRAINT CK_CoverageAssignments_SelectionState CHECK (SelectionState IN (
            N'AlwaysActive', N'RequiredAndLocked', N'RecommendedAndSelected',
            N'RecommendedButExcluded', N'OptionalAndSelected', N'OptionalAndNotSelected',
            N'NotApplicable', N'Retired')),
        CONSTRAINT CK_CoverageAssignments_RecommendationConfidence CHECK (
            RecommendationConfidence IS NULL OR RecommendationConfidence IN (N'High', N'Medium', N'Low')),
        INDEX IX_CoverageAssignments_RunId NONCLUSTERED (RunId),
        INDEX IX_CoverageAssignments_Scope NONCLUSTERED (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC)
    );
END;
GO
