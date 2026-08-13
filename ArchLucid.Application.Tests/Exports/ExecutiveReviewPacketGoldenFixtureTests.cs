using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SponsorReviewPacketGoldenFixtureTests
{
    [Fact]
    public void Seeded_demo_run_packet_matches_golden_markdown()
    {
        SponsorReviewPacketDemoFixture.DemoPacketInputs inputs =
            SponsorReviewPacketDemoFixture.CreateSeededDemoRun();

        string actual = NormalizeNewlines(SponsorReviewPacketComposer.ComposeMarkdown(
            inputs.Detail,
            inputs.SponsorReport,
            inputs.TopFindingTitles,
            inputs.RoiSummary,
            SponsorReviewPacketDemoFixture.StableGeneratedUtc,
            inputs.TopDecisions,
            inputs.PortfolioSignals));

        string golden = NormalizeNewlines(SponsorReviewPacketDemoFixture.LoadGoldenMarkdown());

        actual.Should().Be(golden, "Update Exports/Golden/sponsor-review-packet-demo-run.md when packet sections change deliberately.");
    }

    private static string NormalizeNewlines(string text)
    {
        return text.Replace("\r\n", "\n", StringComparison.Ordinal).Replace("\r", "\n", StringComparison.Ordinal);
    }

    [Fact]
    public void Executive_review_packet_includes_execution_mode_section()
    {
        SponsorReviewPacketDemoFixture.DemoPacketInputs inputs =
            SponsorReviewPacketDemoFixture.CreateSeededDemoRun();

        string markdown = SponsorReviewPacketComposer.ComposeMarkdown(
            inputs.Detail,
            inputs.SponsorReport,
            inputs.TopFindingTitles,
            inputs.RoiSummary,
            SponsorReviewPacketDemoFixture.StableGeneratedUtc,
            inputs.TopDecisions,
            inputs.PortfolioSignals);

        markdown.Should().Contain("## Execution mode");
        markdown.Should().Contain("Simulator");
        markdown.Should().Contain("Not real-mode AI");
    }

    [Fact]
    public void Seeded_demo_run_packet_includes_roi_basis_label()
    {
        SponsorReviewPacketDemoFixture.DemoPacketInputs inputs =
            SponsorReviewPacketDemoFixture.CreateSeededDemoRun();

        string markdown = SponsorReviewPacketComposer.ComposeMarkdown(
            inputs.Detail,
            inputs.SponsorReport,
            inputs.TopFindingTitles,
            inputs.RoiSummary,
            SponsorReviewPacketDemoFixture.StableGeneratedUtc,
            inputs.TopDecisions,
            inputs.PortfolioSignals);

        markdown.Should().Contain("## Top decisions");
        markdown.Should().Contain("## Portfolio signals (live)");
        markdown.Should().Contain("Review stale PHI minimization risk");
        markdown.Should().NotContain("(mock)");
        markdown.Should().Contain($"**Savings pricing basis:** {SponsorRoiSavingsPricingBasis.EaAdjusted}");
        markdown.Should().Contain("**Pricing basis note:**");
        markdown.Should().Contain("PHI minimization risk at intake boundary");
        markdown.Should().Contain("Claims Intake Modernization");
    }

    [Fact]
    public void Seeded_demo_run_packet_preserves_required_sponsor_sections()
    {
        SponsorReviewPacketDemoFixture.DemoPacketInputs inputs =
            SponsorReviewPacketDemoFixture.CreateSeededDemoRun();

        string markdown = SponsorReviewPacketComposer.ComposeMarkdown(
            inputs.Detail,
            inputs.SponsorReport,
            inputs.TopFindingTitles,
            inputs.RoiSummary,
            SponsorReviewPacketDemoFixture.StableGeneratedUtc,
            inputs.TopDecisions,
            inputs.PortfolioSignals);

        string[] requiredSections =
        [
            "## Manifest summary",
            "## Execution mode",
            "## Top decisions",
            "## Review summary",
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
