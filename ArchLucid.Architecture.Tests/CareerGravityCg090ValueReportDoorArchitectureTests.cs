using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-090 ratchet: sponsor value-report route shows rehearsal honesty on Working.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg090ValueReportDoorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg090_value_report_wires_route_career_honesty_strip()
    {
        string copy = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "insights", "value-report-career-honesty.ts"));
        string pageView = File.ReadAllText(
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

        copy.Should().Contain("VALUE_REPORT_MEASURED_SAVINGS_DISCLAIMER");
        copy.Should().Contain("resolveValueReportCareerHonesty");
        pageView.Should().Contain("ValueReportCareerHonestyStrip");
        pageView.Should().Contain("useValueReportCareerHonesty");
        pageView.Should().NotContain("G-REAL-06 executed");
    }

    [Fact]
    public void Cg090_docs_record_value_report_rehearsal_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-090");
        docs.Should().Contain("Value report rehearsal honesty");
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
