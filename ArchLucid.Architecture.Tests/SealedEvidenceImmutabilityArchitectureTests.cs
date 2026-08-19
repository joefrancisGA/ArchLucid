using System.Reflection;
using System.Text.RegularExpressions;

using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-303 / ADR 0039: commit-sealed evidence immutability contracts stay wired.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SealedEvidenceImmutabilityArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly Regex Migration247TableNameRegex = new(
        @"\(N'dbo\.(?<name>[^']+)'\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    [Fact]
    public void Sealed_evidence_adr_and_inventory_docs_exist()
    {
        File.Exists(Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0039-commit-sealed-evidence-immutability.md"))
            .Should()
            .BeTrue();

        File.Exists(Path.Combine(RepoRoot, "docs", "library", "EVIDENCE_IMMUTABILITY.md"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Sealed_evidence_registry_matches_migration_247_table_list()
    {
        string migrationPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Persistence",
            "Migrations",
            "247_CommitSealedEvidenceImmutability.sql");

        string migrationText = File.ReadAllText(migrationPath);
        HashSet<string> migrationTables = Migration247TableNameRegex
            .Matches(migrationText)
            .Select(static m => "dbo." + m.Groups["name"].Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> registryTables = SealedEvidenceTableRegistry.SealedTableNames
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        registryTables.Should().BeEquivalentTo(migrationTables);
    }

    [Fact]
    public void Sealed_evidence_enrichments_table_is_not_sealed()
    {
        SealedEvidenceTableRegistry.SealedTableNames
            .Should()
            .NotContain(SealedEvidenceTableRegistry.AgentResultEnrichmentsTableName);
    }

    [Fact]
    public void Sealed_evidence_startup_probe_iterates_registry()
    {
        string probePath = Path.Combine(
            RepoRoot,
            "ArchLucid.Host.Core",
            "Startup",
            "Validation",
            "Rules",
            "SqlSealedEvidenceImmutabilityRules.cs");

        string probeText = File.ReadAllText(probePath);
        probeText.Should().Contain(nameof(SealedEvidenceTableRegistry.SealedTableNames));
        probeText.Should().Contain("SqlDatabaseImmutabilityProbeHelpers.CollectMissingDenyPermissions");
    }

    [Fact]
    public void Sealed_evidence_agent_result_repository_has_no_patch_or_delete_methods()
    {
        MethodInfo[] methods = typeof(IAgentResultRepository).GetMethods();

        // TB-938 selective re-execute: task-scoped DeleteForRunTaskAsync is allowed before finalize.
        // Broad Update/Patch/Delete/MarkEvidence mutation APIs remain forbidden.
        methods.Select(static m => m.Name)
            .Where(static name => !string.Equals(name, "DeleteForRunTaskAsync", StringComparison.Ordinal))
            .Should()
            .NotContain(static name =>
                name.Contains("Update", StringComparison.OrdinalIgnoreCase)
                || name.Contains("Delete", StringComparison.OrdinalIgnoreCase)
                || name.Contains("Patch", StringComparison.OrdinalIgnoreCase)
                || name.Contains("MarkEvidence", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Sealed_evidence_agent_evidence_package_repository_has_no_delete_before_insert()
    {
        string repoPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Persistence",
            "Data",
            "Repositories",
            "AgentEvidencePackageRepository.cs");

        string repoText = File.ReadAllText(repoPath);
        repoText.Should().NotContain("DELETE FROM AgentEvidencePackages", because: "packages are insert-only post-commit");
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
