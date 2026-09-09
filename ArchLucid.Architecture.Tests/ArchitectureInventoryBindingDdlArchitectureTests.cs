using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-047: dbo.ArchitectureInventoryBindings DDL is present in migration and greenfield scripts.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventoryBindingDdlArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Migration_378_creates_architecture_inventory_bindings_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "378_ArchitectureInventoryBindings.sql");

        migrationText.Should().Contain("CREATE TABLE dbo.ArchitectureInventoryBindings");
        migrationText.Should().Contain("ArchitectureId");
        migrationText.Should().Contain("SnapshotId");
        migrationText.Should().Contain("BoundBy");
        migrationText.Should().Contain("BoundUtc");
        migrationText.Should().Contain("RowVersion");
        migrationText.Should().Contain("FK_ArchitectureInventoryBindings_Architectures");
        migrationText.Should().Contain("FK_ArchitectureInventoryBindings_Snapshots");
        migrationText.Should().NotContain("ROW LEVEL SECURITY", "ADR 0037 tenant catalog — no SQL RLS (AS-047)");
        migrationText.Should().NotContain("CREATE SECURITY POLICY", "ADR 0037 tenant catalog — no SQL RLS (AS-047)");
    }

    [Fact]
    public void Rollback_378_drops_architecture_inventory_bindings_table()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R378_ArchitectureInventoryBindings.sql");

        rollbackText.Should().Contain("DROP TABLE dbo.ArchitectureInventoryBindings");
    }

    [Fact]
    public void ArchLucid_sql_creates_architecture_inventory_bindings_table()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid.sql");

        ddl.Should().Contain("CREATE TABLE dbo.ArchitectureInventoryBindings");
        ddl.Should().Contain("BoundBy");
        ddl.Should().Contain("RowVersion");
    }

    [Fact]
    public void ArchLucid_unified_schema_creates_architecture_inventory_bindings_table()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid_Unified_Schema.sql");

        ddl.Should().Contain("CREATE TABLE dbo.ArchitectureInventoryBindings");
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
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
