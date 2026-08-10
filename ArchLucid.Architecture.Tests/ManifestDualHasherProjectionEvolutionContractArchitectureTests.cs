using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-1156: dual hasher / projection evolution contract artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ManifestDualHasherProjectionEvolutionContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb1156_dual_hasher_contract_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-1156");
        text.Should().Contain("ManifestHashService");
        text.Should().Contain("GoldenManifestFingerprint.ComputeContentSha256Hex");
        text.Should().Contain("AuthorityCommitProjectionBuilder");
        text.Should().Contain("TB-1157");
        text.Should().Contain("Forbid");
    }

    [Fact]
    public void Tb1156_production_and_cohort_hasher_sources_exist()
    {
        string manifestHashPath = Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "ManifestHashService.cs");
        string fingerprintPath = Path.Combine(RepoRoot, "ArchLucid.Contracts", "Manifest", "GoldenManifestFingerprint.cs");
        string projectionPath = Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Manifest", "AuthorityCommitProjectionBuilder.cs");

        File.Exists(manifestHashPath).Should().BeTrue();
        File.Exists(fingerprintPath).Should().BeTrue();
        File.Exists(projectionPath).Should().BeTrue();

        File.ReadAllText(manifestHashPath).Should().Contain("CreatedUtc");
        File.ReadAllText(fingerprintPath).Should().Contain("ComputeContentSha256Hex");
        File.ReadAllText(projectionPath).Should().Contain("MapGovernance");
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
