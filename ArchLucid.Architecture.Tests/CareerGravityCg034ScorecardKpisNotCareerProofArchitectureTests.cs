using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-034 ratchet: architecture scorecard KPI grid shows rehearsal honesty on Working.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg034ScorecardKpisNotCareerProofArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg034_scorecard_page_wires_kpi_career_honesty_strip()
    {
        string copy = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "scorecard", "scorecard-kpi-career-honesty.ts"));
        string pageView = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "architecture-scorecard",
                "_sections",
                "PilotScorecardPageView.tsx"));
        string outcomes = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "architecture-scorecard",
                "_sections",
                "PilotScorecardPrimaryOutcomes.tsx"));

        copy.Should().Contain("SCORECARD_KPI_CAREER_BLOCKED_TITLE");
        copy.Should().Contain("resolveScorecardKpiCareerHonesty");
        pageView.Should().Contain("ScorecardKpiCareerHonestyStrip");
        pageView.Should().Contain("useScorecardKpiCareerHonesty");
        outcomes.Should().Contain("kpiSectionQualifier");
    }

    [Fact]
    public void Cg034_docs_record_scorecard_kpi_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-034");
        docs.Should().Contain("Scorecard KPIs are not Career proof");
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
