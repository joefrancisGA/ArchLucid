using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-010 ratchet: shrink Working peer review mints when architecture id is known (SY-80 leftovers).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn010NestedReviewJobVsDeskArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn010_mint_module_names_nested_resolver_and_unlinked_honesty()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-nested-review-job-mint.ts"));

        module.Should().Contain("resolveSystemNotJobWorkingReviewOpenHref");
        module.Should().Contain("resolveSystemNotJobWorkingReviewArchitectureId");
        module.Should().Contain("SYSTEM_NOT_JOB_UNLINKED_REVIEW_PEER_HONESTY");
        module.Should().Contain("SN-010");
    }

    [Fact]
    public void Sn010_impact_preview_surfaces_use_nested_review_resolver()
    {
        string evolutionView = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "impact-preview",
                "_sections",
                "EvolutionReviewPageView.tsx"));

        string evidenceBasis = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "impact-preview",
                "_sections",
                "ImpactPreviewEvidenceBasisSection.tsx"));

        evolutionView.Should().Contain("resolveSystemNotJobWorkingReviewOpenHref");
        evolutionView.Should().Contain("pinnedArchitectureId");
        evidenceBasis.Should().Contain("resolveSystemNotJobWorkingReviewOpenHref");
        evidenceBasis.Should().Contain("architectureId");
    }

    [Fact]
    public void Sn010_vitest_ratchet_names_peer_honesty_and_inventory_rows()
    {
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-nested-review-job-mint.test.ts"));

        test.Should().Contain("SN-010");
        test.Should().Contain("keeps honest peer href");
        test.Should().Contain("SYSTEM_NOT_JOB_NESTED_REVIEW_JOB_MINT_ROWS");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
