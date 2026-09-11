using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-035 ratchet: ROI / value-report tiles show rehearsal honesty on Working.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg035RoiNotCareerProofArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg035_roi_summary_wires_tile_career_honesty_strip()
    {
        string copy = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "roi", "roi-tile-career-honesty.ts"));
        string roiSummary = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "roi-summary",
                "_sections",
                "RoiSummaryPageView.tsx"));
        string sponsorReport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "sponsor-report",
                "_sections",
                "PilotValueReportPageView.tsx"));

        copy.Should().Contain("ROI_TILE_CAREER_BLOCKED_TITLE");
        copy.Should().Contain("resolveRoiTileCareerHonesty");
        roiSummary.Should().Contain("RoiTileCareerHonestyStrip");
        roiSummary.Should().Contain("useRoiTileCareerHonesty");
        sponsorReport.Should().Contain("RoiTileCareerHonestyStrip");
    }

    [Fact]
    public void Cg035_docs_record_roi_tile_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-035");
        docs.Should().Contain("ROI tiles are not Career proof");
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

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
