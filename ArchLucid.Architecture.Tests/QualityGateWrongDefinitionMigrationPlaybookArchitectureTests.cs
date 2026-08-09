using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-974: wrong-gate migration playbook artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class QualityGateWrongDefinitionMigrationPlaybookArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb974_wrong_definition_migration_playbook_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "QUALITY_GATE_WRONG_DEFINITION_MIGRATION_PLAYBOOK.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-974");
        text.Should().Contain("QualityGateSupersedingEvaluation");
        text.Should().Contain("Tenant.QualityGateDefinitionDeprecated");
        text.Should().Contain("never");
    }

    [Fact]
    public void Tb974_core_superseding_evaluation_type_exists()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Core", "QualityGates", "QualityGateSupersedingEvaluation.cs");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("QualityGateWrongDefinitionClass");
        text.Should().Contain("OriginalRecordedOutcome");
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
