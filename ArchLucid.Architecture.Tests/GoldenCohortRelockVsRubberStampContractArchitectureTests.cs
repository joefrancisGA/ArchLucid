using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-1172: golden-cohort re-lock vs rubber-stamp contract artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GoldenCohortRelockVsRubberStampContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb1172_relock_vs_rubber_stamp_contract_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-1172");
        text.Should().Contain("rubber stamp");
        text.Should().Contain("Never re-lockable");
        text.Should().Contain("TB-1173");
        text.Should().Contain("ManifestHash");
    }

    [Fact]
    public void Tb1172_golden_cohort_readme_and_cohort_json_exist()
    {
        string readmePath = Path.Combine(RepoRoot, "tests", "golden-cohort", "README.md");
        string cohortPath = Path.Combine(RepoRoot, "tests", "golden-cohort", "cohort.json");

        File.Exists(readmePath).Should().BeTrue();
        File.Exists(cohortPath).Should().BeTrue();

        File.ReadAllText(readmePath).Should().Contain("ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED");
        File.ReadAllText(cohortPath).Should().Contain("expectedCommittedManifestSha256");
    }

    [Fact]
    public void Tb1172_dual_hasher_contract_companion_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        File.ReadAllText(path).Should().Contain("TB-1156");
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
