using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guards the ADR 0064 synonym repair for <c>dbo.Runs.AcknowledgedCoverageJson</c>
///     (migrations 356 and 359). The original 356 targeted <c>OBJECT_ID(N'dbo.Runs', N'U')</c>,
///     which is NULL after 295 left <c>dbo.Runs</c> as a synonym for <c>dbo.Reviews</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AcknowledgedCoverageJsonPhysicalTableRepairArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Migration_356_resolves_reviews_physical_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "356_Runs_AcknowledgedCoverageJson.sql");

        migrationText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        migrationText.Should().Contain("AcknowledgedCoverageJson");
        migrationText.Should().Contain("sp_executesql");
        migrationText.Should().NotContain("ALTER TABLE dbo.Runs ADD AcknowledgedCoverageJson");
    }

    [Fact]
    public void Repair_migration_359_resolves_reviews_physical_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "359_Runs_AcknowledgedCoverageJson_Repair.sql");

        migrationText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        migrationText.Should().Contain("AcknowledgedCoverageJson");
        migrationText.Should().Contain("sp_executesql");
        migrationText.Should().Contain("Invalid column name 'AcknowledgedCoverageJson'");
        migrationText.Should().NotContain("ALTER TABLE dbo.Runs ADD AcknowledgedCoverageJson");
    }

    [Fact]
    public void Repair_rollback_359_targets_physical_table()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R359_Runs_AcknowledgedCoverageJson_Repair.sql");

        rollbackText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        rollbackText.Should().Contain("DROP COLUMN AcknowledgedCoverageJson");
        rollbackText.Should().Contain("sp_executesql");
    }

    [Fact]
    public void Rollback_356_targets_physical_table()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R356_Runs_AcknowledgedCoverageJson.sql");

        rollbackText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        rollbackText.Should().Contain("DROP COLUMN AcknowledgedCoverageJson");
        rollbackText.Should().Contain("sp_executesql");
    }

    [Fact]
    public void ArchLucid_sql_adds_acknowledged_coverage_json_on_physical_table()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid.sql");

        ddl.Should().Contain("AcknowledgedCoverageJson");
        ddl.Should().Contain("@acknowledgedCoverageRunTable");
        ddl.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        ddl.Should().Contain("sp_executesql");
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
