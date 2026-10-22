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

IF OBJECT_ID(N'dbo.PillarCatalog', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.PillarCatalog WHERE PillarKey = N'Security')
BEGIN
    INSERT INTO dbo.PillarCatalog (PillarKey, DisplayName, DisplayOrder, IsReviewIntegrityAxis)
    VALUES
        (N'Security', N'Security', 1, 0),
        (N'ReliabilityAndResilience', N'Reliability and Resilience', 2, 0),
        (N'PerformanceAndScalability', N'Performance and Scalability', 3, 0),
        (N'CostEffectiveness', N'Cost Effectiveness', 4, 0),
        (N'OperationalExcellence', N'Operational Excellence', 5, 0),
        (N'DataAndCompliance', N'Data and Compliance', 6, 0),
        (N'SustainabilityAndResourceEfficiency', N'Sustainability and Resource Efficiency', 7, 0);
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

IF OBJECT_ID(N'dbo.PillarCategoryMap', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.PillarCategoryMap WHERE SourceCategory = N'Security')
BEGIN
    INSERT INTO dbo.PillarCategoryMap (SourceCategory, PillarKey, IsReviewIntegrity)
    VALUES
        (N'Security', N'Security', 0),
        (N'Compliance', N'DataAndCompliance', 0),
        (N'Cost', N'CostEffectiveness', 0),
        (N'CostOptimization', N'CostEffectiveness', 0),
        (N'Requirement', NULL, 1),
        (N'Topology', NULL, 1),
        (N'Policy', NULL, 1),
        (N'Correctness', NULL, 1),
        (N'Governance', NULL, 1),
        (N'GovernanceSimulation', NULL, 1),
        (N'TechnologyLedger', NULL, 1);
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
