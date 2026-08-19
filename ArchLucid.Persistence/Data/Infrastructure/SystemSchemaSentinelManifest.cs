namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Curated system-catalog sentinels aligned with <c>ArchLucid.System.sql</c>.</summary>
public static class SystemSchemaSentinelManifest
{
    public static IReadOnlyList<SchemaSentinelExpectation> Expectations { get; } =
    [
        new SchemaSentinelExpectation
        {
            TableName = "Tenants",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "Id", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "Slug", SqlDataType = "nvarchar" },
            ],
            IndexNames = ["UQ_Tenants_Slug"],
        },
        new SchemaSentinelExpectation
        {
            TableName = "TenantDatabaseBindings",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "TenantId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "SqlLogicalDatabaseName", SqlDataType = "nvarchar" },
            ],
            IndexNames = ["IX_TenantDatabaseBindings_ProvisioningState"],
        },
        new SchemaSentinelExpectation
        {
            TableName = "TenantDatabaseProvisioningJobs",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "JobId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "TenantId", SqlDataType = "uniqueidentifier" },
            ],
            IndexNames = ["IX_TenantDatabaseProvisioningJobs_TenantId"],
        },
        new SchemaSentinelExpectation
        {
            TableName = "WarmTenantCatalogStandby",
            Columns =
            [
                new SchemaSentinelColumn { ColumnName = "StandbyId", SqlDataType = "uniqueidentifier" },
                new SchemaSentinelColumn { ColumnName = "SqlLogicalDatabaseName", SqlDataType = "nvarchar" },
            ],
            IndexNames = ["UQ_WarmTenantCatalogStandby_DbName", "IX_WarmTenantCatalogStandby_Unclaimed"],
        },
    ];
}
