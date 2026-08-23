using System.Text.RegularExpressions;

using ArchLucid.Core.Persistence;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guards the ADR 0064 synonym repair for <c>dbo.Runs.GovernanceScopeJson</c> (migration 322).
///     Migration 321 targeted <c>OBJECT_ID(N'dbo.Runs', N'U')</c>, which is NULL after 295 left
///     <c>dbo.Runs</c> as a synonym for <c>dbo.Reviews</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GovernanceScopeJsonPhysicalTableRepairArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly Regex MigrationAnchorColumnRegex = new(
        @"i\.(?<name>[A-Za-z]+)\s+EXCEPT",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Repair_migration_322_resolves_reviews_physical_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "322_Reviews_GovernanceScopeJson_Repair.sql");

        migrationText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        migrationText.Should().Contain("GovernanceScopeJson");
        migrationText.Should().Contain(CommittedRunHeaderAnchorRegistry.TriggerName);
        migrationText.Should().Contain("sp_executesql");
        migrationText.Should().NotContain("IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL\r\n   AND COL_LENGTH(N'dbo.Runs', N'GovernanceScopeJson')");
    }

    [Fact]
    public void Repair_rollback_322_targets_physical_table()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R322_Reviews_GovernanceScopeJson_Repair.sql");

        rollbackText.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        rollbackText.Should().Contain("DROP COLUMN GovernanceScopeJson");
        rollbackText.Should().Contain(CommittedRunHeaderAnchorRegistry.TriggerName);
    }

    [Fact]
    public void ArchLucid_sql_adds_governance_scope_json_on_physical_table()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid.sql");

        ddl.Should().Contain("GovernanceScopeJson");
        ddl.Should().Contain("OBJECT_ID(N'dbo.Reviews', N'U')");
        ddl.Should().Contain(CommittedRunHeaderAnchorRegistry.TriggerName);
    }

    [Fact]
    public void Repair_migration_322_trigger_columns_match_registry()
    {
        string migrationText = ReadPersistenceSql("Migrations", "322_Reviews_GovernanceScopeJson_Repair.sql");
        HashSet<string> migrationColumns = MigrationAnchorColumnRegex
            .Matches(migrationText)
            .Select(static m => m.Groups["name"].Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> registryColumns = CommittedRunHeaderAnchorRegistry.AnchorColumnNames
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        registryColumns.Should().BeEquivalentTo(migrationColumns);
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
