using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-072 ratchet: Working decision-grade list, inspect, and stamp surfaces wire semantic support band.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs072RatchetDecisionGradeShowsBandArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As072_inventory_lists_guarded_source_roots()
    {
        string inventory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "decision-grade-semantic-support-band-inventory.ts"));

        inventory.Should().Contain("DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES");
        inventory.Should().Contain("working-findings-list-quick-decision-summary-row");
        inventory.Should().Contain("working-finding-inspect-body");
        inventory.Should().Contain("working-review-package-stamp-band");
        inventory.Should().Contain("QuickDecisionSummaryFindingRow.tsx");
        inventory.Should().Contain("FindingInspectFindingBody.tsx");
        inventory.Should().Contain("RunDetailReviewPackageStampViewport.tsx");
    }

    [Fact]
    public void As072_guard_requires_as061_band_markers()
    {
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "decision-grade-semantic-support-band-guard.ts"));

        guard.Should().Contain("FindingSemanticSupportBandChip");
        guard.Should().Contain("FindingSemanticSupportBandInspectSection");
        guard.Should().Contain("RunDetailReviewPackageSemanticSupportBandSummary");
        guard.Should().Contain("findDecisionGradeSemanticSupportBandGuardViolations");
    }

    [Fact]
    public void As072_vitest_guard_blocks_unchip_decision_grade_list_rows()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "decision-grade-semantic-support-band-guard.test.ts"));

        test.Should().Contain("findDecisionGradeSemanticSupportBandGuardViolations");
        test.Should().Contain("unchip");
    }

    [Fact]
    public void As072_chip_helper_defaults_decision_grade_to_not_scored()
    {
        string chip = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "findings",
                "FindingSemanticSupportBandChip.tsx"));

        chip.Should().Contain("resolveSemanticSupportBandPresentationForFinding");
        chip.Should().Contain("isDecisionGradeFinding");
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
