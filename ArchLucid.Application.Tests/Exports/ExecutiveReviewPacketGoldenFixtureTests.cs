using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ExecutiveReviewPacketGoldenFixtureTests
{
    [Fact]
    public void Seeded_demo_run_packet_matches_golden_markdown()
    {
        ExecutiveReviewPacketDemoFixture.DemoPacketInputs inputs =
            ExecutiveReviewPacketDemoFixture.CreateSeededDemoRun();

        string actual = NormalizeNewlines(ExecutiveReviewPacketComposer.ComposeMarkdown(
            inputs.Detail,
            inputs.ExecutiveSummary,
            inputs.TopFindingTitles,
            inputs.RoiSummary,
            ExecutiveReviewPacketDemoFixture.StableGeneratedUtc,
            inputs.TopDecisions,
            inputs.PortfolioSignals));

        string golden = NormalizeNewlines(ExecutiveReviewPacketDemoFixture.LoadGoldenMarkdown());

        actual.Should().Be(golden, "Update Exports/Golden/executive-review-packet-demo-run.md when packet sections change deliberately.");
    }

    private static string NormalizeNewlines(string text)
    {
        return text.Replace("\r\n", "\n", StringComparison.Ordinal).Replace("\r", "\n", StringComparison.Ordinal);
    }

    [Fact]
    public void Seeded_demo_run_packet_includes_roi_basis_label()
    {
        ExecutiveReviewPacketDemoFixture.DemoPacketInputs inputs =
            ExecutiveReviewPacketDemoFixture.CreateSeededDemoRun();

        string markdown = ExecutiveReviewPacketComposer.ComposeMarkdown(
            inputs.Detail,
            inputs.ExecutiveSummary,
            inputs.TopFindingTitles,
            inputs.RoiSummary,
            ExecutiveReviewPacketDemoFixture.StableGeneratedUtc,
            inputs.TopDecisions,
            inputs.PortfolioSignals);

        markdown.Should().Contain("## Top decisions");
        markdown.Should().Contain("## Portfolio signals (live)");
        markdown.Should().Contain("Review stale PHI minimization risk");
        markdown.Should().NotContain("(mock)");
        markdown.Should().Contain($"**Savings pricing basis:** {ExecutiveRoiSavingsPricingBasis.EaAdjusted}");
        markdown.Should().Contain("**Pricing basis note:**");
        markdown.Should().Contain("PHI minimization risk at intake boundary");
        markdown.Should().Contain("Claims Intake Modernization");
    }

    [Fact]
    public void Seeded_demo_run_packet_preserves_required_sponsor_sections()
    {
        ExecutiveReviewPacketDemoFixture.DemoPacketInputs inputs =
            ExecutiveReviewPacketDemoFixture.CreateSeededDemoRun();

        string markdown = ExecutiveReviewPacketComposer.ComposeMarkdown(
            inputs.Detail,
            inputs.ExecutiveSummary,
            inputs.TopFindingTitles,
            inputs.RoiSummary,
            ExecutiveReviewPacketDemoFixture.StableGeneratedUtc,
            inputs.TopDecisions,
            inputs.PortfolioSignals);

        string[] requiredSections =
        [
            "## Manifest summary",
            "## Top decisions",
            "## Run summary",
            "## Portfolio signals (live)",
            "## ROI basis",
            "## Sponsor artifact evidence badges",
            "## ROI basis by disposition",
            "## Realized value (computed)",
            "Confidence:",
            "Evidence:",
            "**Cost evidence freshness:**",
        ];

        foreach (string section in requiredSections)
        {
            markdown.Should().Contain(section, because: $"sponsor packet must retain {section}");
        }
    }
}
