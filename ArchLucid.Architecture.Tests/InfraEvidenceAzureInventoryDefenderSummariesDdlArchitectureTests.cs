using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>IE-HOTFIX: dbo.AzureInventoryDefenderSummaries must ship in DbUp + ArchLucid.sql (detail read always SELECTs it).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InfraEvidenceAzureInventoryDefenderSummariesDdlArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Migration_389_adds_azure_inventory_defender_summaries_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "389_AzureInventoryDefenderSummaries.sql");

        migrationText.Should().Contain("CREATE TABLE dbo.AzureInventoryDefenderSummaries");
        migrationText.Should().Contain("DefenderSummaryRowId");
        migrationText.Should().Contain("SnapshotId");
        migrationText.Should().Contain("TenantId");
        migrationText.Should().Contain("ResourceId");
        migrationText.Should().Contain("SecureScore");
        migrationText.Should().Contain("SourceEvidenceReference");
        migrationText.Should().Contain("FK_AzureInventoryDefenderSummaries_Snapshots");
        migrationText.Should().Contain("IX_AzureInventoryDefenderSummaries_Tenant_Snapshot");
        migrationText.Should().NotContain("ROW LEVEL SECURITY");
        migrationText.Should().NotContain("CREATE SECURITY POLICY");
    }

    [Fact]
    public void Rollback_389_drops_azure_inventory_defender_summaries()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R389_AzureInventoryDefenderSummaries.sql");

        rollbackText.Should().Contain("DROP TABLE dbo.AzureInventoryDefenderSummaries");
    }

    [Fact]
    public void ArchLucid_sql_includes_azure_inventory_defender_summaries_ddl()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid.sql");

        ddl.Should().Contain("CREATE TABLE dbo.AzureInventoryDefenderSummaries");
        ddl.Should().Contain("IX_AzureInventoryDefenderSummaries_Tenant_Snapshot");
    }

    [Fact]
    public void ArchLucid_unified_schema_includes_azure_inventory_defender_summaries_ddl()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid_Unified_Schema.sql");

        ddl.Should().Contain("CREATE TABLE dbo.AzureInventoryDefenderSummaries");
        ddl.Should().Contain("FK_AzureInventoryDefenderSummaries_Snapshots");
    }

    [Fact]
    public void Snapshot_detail_read_references_defender_summaries_table()
    {
        string readSource = ReadPersistenceSql(
            "InfraEvidence",
            "SqlAzureInventorySnapshotRepository.Read.cs");

        readSource.Should().Contain("FROM dbo.AzureInventoryDefenderSummaries");
    }

    [Fact]
    public void Snapshot_detail_read_tables_exist_in_numbered_migrations()
    {
        string readSource = ReadPersistenceSql(
            "InfraEvidence",
            "SqlAzureInventorySnapshotRepository.Read.cs");
        string[] migrationFiles = Directory.GetFiles(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Migrations"),
            "*.sql",
            SearchOption.TopDirectoryOnly);
        string combinedMigrations = string.Join(
            '\n',
            migrationFiles.Select(File.ReadAllText));

        string[] requiredTables =
        [
            "dbo.AzureInventoryResources",
            "dbo.AzureInventoryResourceProperties",
            "dbo.AzureInventoryTags",
            "dbo.AzureInventoryResourceRelationships",
            "dbo.AzureInventoryRoleAssignments",
            "dbo.AzureInventoryDiagnosticConfigurations",
            "dbo.AzureInventoryDefenderSummaries",
        ];

        foreach (string tableName in requiredTables)
        {
            readSource.Should().Contain(tableName);
            combinedMigrations.Should().Contain(
                tableName,
                $"expected {tableName} in at least one numbered migration");
        }
    }

    private static string ReadPersistenceSql(params string[] relativeSegments)
    {
        string[] parts = new string[relativeSegments.Length + 2];
        parts[0] = RepoRoot;
        parts[1] = "ArchLucid.Persistence";
        Array.Copy(relativeSegments, 0, parts, 2, relativeSegments.Length);
        string path = Path.Combine(parts);
        File.Exists(path).Should().BeTrue($"expected SQL at {path}");

        return File.ReadAllText(path);
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
