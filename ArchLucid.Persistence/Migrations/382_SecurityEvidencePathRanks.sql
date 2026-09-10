/*
  382: SecureNow architect — path ranking breakdown (SA-09).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRankWeights', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidencePathRankWeights
    (
        TenantId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityEvidencePathRankWeights PRIMARY KEY CLUSTERED,
        WeightsJson         NVARCHAR(MAX)     NOT NULL,
        UpdatedByActorKey   NVARCHAR(256)     NOT NULL,
        UpdatedUtc          DATETIME2         NOT NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRanks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidencePathRanks
    (
        PathId                      UNIQUEIDENTIFIER NOT NULL,
        TenantId                    UNIQUEIDENTIFIER NOT NULL,
        SnapshotId                  UNIQUEIDENTIFIER NOT NULL,
        RuleVersion                 NVARCHAR(64)      NOT NULL,
        TechnicalExposureScore      DECIMAL(4, 2)     NOT NULL,
        PrivilegeDepthScore         DECIMAL(4, 2)     NOT NULL,
        BlastRadiusScore            DECIMAL(4, 2)     NOT NULL,
        BusinessConsequenceScore    DECIMAL(4, 2)     NULL,
        ConfidenceBandScore         DECIMAL(4, 2)     NOT NULL,
        CompositeSortScore          DECIMAL(6, 3)     NOT NULL,
        RankOrder                   INT               NOT NULL,
        ExplanationSummary          NVARCHAR(1024)    NOT NULL,
        BreakdownJson                 NVARCHAR(MAX)     NOT NULL,
        ComputedUtc                 DATETIME2         NOT NULL,
        CONSTRAINT PK_SecurityEvidencePathRanks PRIMARY KEY CLUSTERED (TenantId, PathId),
        CONSTRAINT FK_SecurityEvidencePathRanks_Paths
            FOREIGN KEY (PathId) REFERENCES dbo.SecurityEvidencePaths (PathId)
    );

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePathRanks_Tenant_Snapshot_Order
        ON dbo.SecurityEvidencePathRanks (TenantId, SnapshotId, RankOrder);

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePathRanks_Tenant_Snapshot_Composite
        ON dbo.SecurityEvidencePathRanks (TenantId, SnapshotId, CompositeSortScore DESC, RankOrder);
END;
GO
