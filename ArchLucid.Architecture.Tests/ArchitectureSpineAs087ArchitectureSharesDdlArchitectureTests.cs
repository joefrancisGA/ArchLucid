using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-087: dbo.ArchitectureShares DDL and Architectures.RestrictToShares default open.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs087ArchitectureSharesDdlArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Migration_380_adds_restrict_to_shares_column_and_architecture_shares_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "380_ArchitectureShares.sql");

        migrationText.Should().Contain("RestrictToShares");
        migrationText.Should().Contain("DF_Architectures_RestrictToShares DEFAULT (0)");
        migrationText.Should().Contain("CREATE TABLE dbo.ArchitectureShares");
        migrationText.Should().Contain("UserId");
        migrationText.Should().Contain("Role");
        migrationText.Should().Contain("GrantedBy");
        migrationText.Should().Contain("GrantedUtc");
        migrationText.Should().Contain("RowVersion");
        migrationText.Should().Contain("FK_ArchitectureShares_Architectures");
        migrationText.Should().Contain("FK_ArchitectureShares_PlatformUsers");
        migrationText.Should().Contain("CK_ArchitectureShares_Role");
        migrationText.Should().Contain("IX_ArchitectureShares_Tenant_User_Architecture");
        migrationText.Should().NotContain("ROW LEVEL SECURITY", "ADR 0037 tenant catalog — no SQL RLS (AS-087)");
        migrationText.Should().NotContain("CREATE SECURITY POLICY", "ADR 0037 tenant catalog — no SQL RLS (AS-087)");
    }

    [Fact]
    public void Rollback_380_drops_architecture_shares_and_restrict_column()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R380_ArchitectureShares.sql");

        rollbackText.Should().Contain("DROP TABLE dbo.ArchitectureShares");
        rollbackText.Should().Contain("DROP COLUMN RestrictToShares");
    }

    [Fact]
    public void ArchLucid_sql_includes_architecture_shares_ddl()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid.sql");

        ddl.Should().Contain("RestrictToShares");
        ddl.Should().Contain("DF_Architectures_RestrictToShares DEFAULT (0)");
        ddl.Should().Contain("CREATE TABLE dbo.ArchitectureShares");
    }

    [Fact]
    public void ArchLucid_unified_schema_includes_architecture_shares_ddl()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid_Unified_Schema.sql");

        ddl.Should().Contain("CREATE TABLE dbo.ArchitectureShares");
        ddl.Should().Contain("RestrictToShares");
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
