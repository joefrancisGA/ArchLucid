namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Curated tenant-catalog sentinels derived from <c>ArchLucid.sql</c> + recent migrations.</summary>
public static class TenantSchemaSentinelManifest
{
    public static IReadOnlyList<SchemaSentinelExpectation> Expectations { get; } =
    [
        new SchemaSentinelExpectation
        {
            TableName = "SchemaVersions",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "Id", SqlDataType = "int" },
                new SchemaSentinelColumn { ColumnName = "ScriptName", SqlDataType = "nvarchar" },
            ],
        },
        new SchemaSentinelExpectation
        {
            // ADR 0064 / migration 295: base table renamed; dbo.Runs remains a synonym.
            TableName = "Reviews",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "RunId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "TenantId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "PackageOrigin", SqlDataType = "nvarchar" },
                new SchemaSentinelColumn { ColumnName = "GovernanceScopeJson", SqlDataType = "nvarchar" },
                new SchemaSentinelColumn { ColumnName = "ArchitectureId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "ImproveLoopEvidenceJson", SqlDataType = "nvarchar" },
                new SchemaSentinelColumn { ColumnName = "KnowledgeModelId", SqlDataType = "nvarchar" },
                new SchemaSentinelColumn { ColumnName = "AcknowledgedCoverageJson", SqlDataType = "nvarchar" },
                new SchemaSentinelColumn { ColumnName = "PinnedPolicyPackIdsJson", SqlDataType = "nvarchar" },
                new SchemaSentinelColumn { ColumnName = "PinnedPolicyPackIdsHashSha256", SqlDataType = "varbinary" },
                new SchemaSentinelColumn { ColumnName = "PinnedEvidencePackagePinsJson", SqlDataType = "nvarchar" },
                new SchemaSentinelColumn { ColumnName = "PinnedEvidencePackagePinsHashSha256", SqlDataType = "varbinary" },
                new SchemaSentinelColumn { ColumnName = "PinnedFocusedPilotModeEnabled", SqlDataType = "bit" },
                new SchemaSentinelColumn { ColumnName = "PinnedFocusedPilotCloudProvider", SqlDataType = "int" },
            ],
        },
        new SchemaSentinelExpectation
        {
            TableName = "Architectures",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "ArchitectureId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "TenantId", SqlDataType = "uniqueidentifier" },
            ],
            IndexNames = ["IX_Architectures_Scope_UpdatedUtc"],
        },
        new SchemaSentinelExpectation
        {
            // ADR 0064 / migration 295: base table renamed; dbo.GoldenManifests remains a synonym.
            TableName = "SignedReviewRecords",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "ManifestId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "RunId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "HasherBoundJson", SqlDataType = "nvarchar" },
            ],
        },
        new SchemaSentinelExpectation
        {
            TableName = "FindingRecords",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "FindingsSnapshotId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "FindingId", SqlDataType = "nvarchar" },
            ],
            IndexNames = ["UQ_FindingRecords_Snapshot_FindingId"],
        },
        new SchemaSentinelExpectation
        {
            TableName = "FindingsSnapshots",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "FindingsSnapshotId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "RunId", SqlDataType = "uniqueidentifier" },
            ],
        },
        new SchemaSentinelExpectation
        {
            TableName = "GraphSnapshots",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "GraphSnapshotId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "RunId", SqlDataType = "uniqueidentifier" },
            ],
        },
        new SchemaSentinelExpectation
        {
            TableName = "RetrievalGroundingTrace",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "TraceId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "RunId", SqlDataType = "uniqueidentifier" },
            ],
            IndexNames = ["IX_RetrievalGroundingTrace_RunId"],
        },
    ];
}
