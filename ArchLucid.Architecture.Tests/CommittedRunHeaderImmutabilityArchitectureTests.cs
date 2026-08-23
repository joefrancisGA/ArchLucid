using System.Reflection;
using System.Text.RegularExpressions;

using ArchLucid.Core.Persistence;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-310 / ADR 0045: committed run header evidence-anchor immutability contracts stay wired.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommittedRunHeaderImmutabilityArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly Regex Migration250ColumnRegex = new(
        @"i\.(?<name>[A-Za-z]+)\s+EXCEPT",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Committed_run_header_adr_exists()
    {
        File.Exists(Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0045-committed-run-header-immutability.md"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Committed_run_header_registry_matches_migration_252_anchor_columns()
    {
        string migrationPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Persistence",
            "Migrations",
            "321_Runs_GovernanceScopeJson.sql");

        string migrationText = File.ReadAllText(migrationPath);
        HashSet<string> migrationColumns = Migration250ColumnRegex
            .Matches(migrationText)
            .Select(static m => m.Groups["name"].Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> registryColumns = CommittedRunHeaderAnchorRegistry.AnchorColumnNames
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        registryColumns.Should().BeEquivalentTo(migrationColumns);
        migrationText.Should().Contain(CommittedRunHeaderAnchorRegistry.TriggerName);
    }

    [Fact]
    public void Committed_run_header_startup_probe_checks_trigger()
    {
        string probePath = Path.Combine(
            RepoRoot,
            "ArchLucid.Host.Core",
            "Startup",
            "Validation",
            "Rules",
            "SqlCommittedRunHeaderImmutabilityRules.cs");

        string probeText = File.ReadAllText(probePath);
        probeText.Should().Contain(nameof(CommittedRunHeaderAnchorRegistry.TriggerName));
        probeText.Should().Contain("SqlDatabaseImmutabilityProbeHelpers.TriggerExists");
    }

    [Fact]
    public void Committed_run_header_startup_wired_in_persistence_startup()
    {
        string startupPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Host.Core",
            "Startup",
            "ArchLucidPersistenceStartup.cs");

        string startupText = File.ReadAllText(startupPath);
        startupText.Should().Contain("TryValidateCommittedRunHeaderImmutabilityIfRequired");
        startupText.Should().Contain("ValidateOrThrow");
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
