using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-972: quality-gate definition versioning contract artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class QualityGateDefinitionVersioningContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb972_quality_gate_definition_versioning_contract_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "QUALITY_GATE_DEFINITION_VERSIONING_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-972");
        text.Should().Contain("advisoryCurrent");
        text.Should().Contain("QualityGateDefinitionFingerprint");
    }

    [Fact]
    public void Tb972_core_contract_types_exist()
    {
        string snapshot = Path.Combine(RepoRoot, "ArchLucid.Core", "QualityGates", "QualityGateDefinitionSnapshot.cs");
        string fingerprint = Path.Combine(RepoRoot, "ArchLucid.Core", "QualityGates", "QualityGateDefinitionFingerprint.cs");
        string authority = Path.Combine(RepoRoot, "ArchLucid.Core", "QualityGates", "QualityGateOutcomeAuthority.cs");

        File.Exists(snapshot).Should().BeTrue();
        File.Exists(fingerprint).Should().BeTrue();
        File.Exists(authority).Should().BeTrue();
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
