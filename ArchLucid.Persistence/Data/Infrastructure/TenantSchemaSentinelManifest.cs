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
            TableName = "Runs",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "RunId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "TenantId", SqlDataType = "uniqueidentifier" },
            ],
        },
        new SchemaSentinelExpectation
        {
            TableName = "GoldenManifests",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "ManifestId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "RunId", SqlDataType = "uniqueidentifier" },
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
