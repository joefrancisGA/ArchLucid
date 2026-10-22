/*
  381: SecureNow architect — security evidence paths and hops (SA-01).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePaths', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidencePaths
    (
        PathId                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityEvidencePaths PRIMARY KEY CLUSTERED,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId               UNIQUEIDENTIFIER NOT NULL,
        ProjectId                 UNIQUEIDENTIFIER NOT NULL,
        SnapshotId                UNIQUEIDENTIFIER NOT NULL,
        PathKind                  INT               NOT NULL,
        PathConfidenceBand        INT               NOT NULL,
        CanonicalHopHashSha256    VARBINARY(32)     NOT NULL,
        WeakestHopOrdinal         INT               NOT NULL,
        WeakestHopReason          NVARCHAR(512)     NOT NULL,
        CrownJewelAssertionId     UNIQUEIDENTIFIER NULL,
        CreatedUtc                DATETIME2         NOT NULL,
        UpdatedUtc                DATETIME2         NOT NULL,
        CONSTRAINT FK_SecurityEvidencePaths_Snapshots
            FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT UQ_SecurityEvidencePaths_Tenant_Snapshot_Hash
            UNIQUE (TenantId, SnapshotId, CanonicalHopHashSha256)
    );

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePaths_Tenant_Snapshot_Kind
        ON dbo.SecurityEvidencePaths (TenantId, SnapshotId, PathKind);

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePaths_Tenant_Path
        ON dbo.SecurityEvidencePaths (TenantId, PathId);
END;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathHops', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidencePathHops
    (
        HopRowId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityEvidencePathHops PRIMARY KEY CLUSTERED,
        PathId              UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        HopOrdinal          INT               NOT NULL,
        FromNodeId          NVARCHAR(512)     NOT NULL,
        ToNodeId            NVARCHAR(512)     NOT NULL,
        EdgeType            NVARCHAR(128)     NOT NULL,
        ProvenanceKind      INT               NOT NULL,
        HopConfidenceBand   INT               NOT NULL,
        InferenceSource     NVARCHAR(128)     NULL,
        EvidenceReference   NVARCHAR(512)     NOT NULL,
        CloudResourceId     UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_SecurityEvidencePathHops_Paths
            FOREIGN KEY (PathId) REFERENCES dbo.SecurityEvidencePaths (PathId),
        CONSTRAINT UQ_SecurityEvidencePathHops_Path_Ordinal
            UNIQUE (TenantId, PathId, HopOrdinal)
    );

    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePathHops_Tenant_Path
        ON dbo.SecurityEvidencePathHops (TenantId, PathId, HopOrdinal);
END;
GO

/*
  SQL Server compiles each GO batch against the current catalog. Adding PathId and then
  referencing it for FK/index in the same batch fails with error 207 (invalid column name)
  because the column does not exist at compile time — IF COL_LENGTH does not defer binding.
  See migration 366 for the same pattern.
*/

IF OBJECT_ID(N'dbo.OperationalSecurityFindings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.OperationalSecurityFindings', N'PathId') IS NULL
BEGIN
    ALTER TABLE dbo.OperationalSecurityFindings
        ADD PathId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.OperationalSecurityFindings', N'PathId') IS NOT NULL
   AND OBJECT_ID(N'dbo.SecurityEvidencePaths', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_OperationalSecurityFindings_SecurityEvidencePaths'
         AND parent_object_id = OBJECT_ID(N'dbo.OperationalSecurityFindings'))
BEGIN
    ALTER TABLE dbo.OperationalSecurityFindings
        ADD CONSTRAINT FK_OperationalSecurityFindings_SecurityEvidencePaths
            FOREIGN KEY (PathId) REFERENCES dbo.SecurityEvidencePaths (PathId);
END;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.OperationalSecurityFindings', N'PathId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_OperationalSecurityFindings_Tenant_PathId'
         AND object_id = OBJECT_ID(N'dbo.OperationalSecurityFindings'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_OperationalSecurityFindings_Tenant_PathId
        ON dbo.OperationalSecurityFindings (TenantId, PathId)
        WHERE PathId IS NOT NULL;
END;
GO
