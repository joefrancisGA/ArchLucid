using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SponsorPacketBuyerDecisionBriefBuilderTests
{
    private const string RunId = "run-abc-123";

    private static string ManifestJson(bool demoDataWarning = false, string? generatedUtc = null) =>
        $$"""
        {
          "formatVersion": "1.0",
          "generatedUtc": "{{generatedUtc ?? "2026-06-06T00:00:00+00:00"}}",
          "runId": "{{RunId}}",
          "demoDataWarning": {{(demoDataWarning ? "true" : "false")}},
          "files": []
        }
        """;

    private static string SponsorReportJson(decimal savings = 125_000m, string scope = "Open + Needs-Evidence findings", int systemCount = 3) =>
        $$"""
        {
          "totalEstimatedUsdSavings": {{savings}},
          "headlineSavingsScopeDescription": "{{scope}}",
          "systemCount": {{systemCount}}
        }
        """;

    private static string LimitationsMd(IEnumerable<string>? holdReasons = null, IEnumerable<string>? warnReasons = null)
    {
        System.Text.StringBuilder sb = new();
        sb.AppendLine("# Limitations");
        sb.AppendLine();

        IReadOnlyList<string> holds = (holdReasons ?? []).ToList();
        IReadOnlyList<string> warns = (warnReasons ?? []).ToList();

        if (holds.Count > 0)
        {
            sb.AppendLine("## Hold reasons");
            sb.AppendLine();

            foreach (string reason in holds)
                sb.AppendLine($"- {reason}");

            sb.AppendLine();
        }

        if (warns.Count > 0)
        {
            sb.AppendLine("## Warn reasons");
            sb.AppendLine();

            foreach (string reason in warns)
                sb.AppendLine($"- {reason}");
        }

        return sb.ToString();
    }

    private static string FirstValueReportMd() =>
        """
        # First value report

        This committed run identified significant cost reduction opportunities across storage and networking tiers.

        ## Execution provenance

        | Field | Value |
        | --- | --- |
        | Mode | Simulator |
        | LLM completion traces (this run) | 4 |
        | Azure OpenAI deployment (when known) | `(n/a)` |

        | Metric | Value |
        | --- | --- |
        | Systems | 3 |
        """;

    private static SponsorPacketBuyerDecisionBriefBuilder.BriefInputs FullInputs() =>
        new(
            RunId,
            ManifestJson(),
            SponsorReportJson(),
            LimitationsMd(),
            FirstValueReportMd());

    [Fact]
    public void Build_full_packet_produces_all_sections()
    {
        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(FullInputs());

        brief.Should().Contain("# Buyer decision brief");
        brief.Should().Contain("## Outcome");
        brief.Should().Contain("## Quantified value");
        brief.Should().Contain("## Top caveats");
        brief.Should().Contain("## Evidence links");
        brief.Should().Contain("## Recommended next step");
    }

    [Fact]
    public void Build_full_packet_shows_run_id_and_disposition_pass()
    {
        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(FullInputs());

        brief.Should().Contain(RunId);
        brief.Should().Contain("**PASS**");
        brief.Should().Contain("sponsor-send ready");
    }

    [Fact]
    public void Build_includes_savings_amount_and_scope_label()
    {
        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(FullInputs());

        // $125,000 in InvariantCulture is $125,000
        brief.Should().Contain("125,000");
        brief.Should().Contain("Open + Needs-Evidence findings");
        brief.Should().Contain("Per-system rows do not sum to the portfolio headline.");
    }

    [Fact]
    public void Build_uses_canonical_scope_labels_when_executive_summary_omits_scope_fields()
    {
        SponsorPacketBuyerDecisionBriefBuilder.BriefInputs inputs = new(
            RunId,
            ManifestJson(),
            """
            {
              "totalEstimatedUsdSavings": 50000,
              "systemCount": 2
            }
            """,
            LimitationsMd(),
            FirstValueReportMd());

        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(inputs);

        brief.Should().Contain("Single-tenant portfolio headline: disposition-aware");
        brief.Should().Contain("Per-system component: estimated USD");
        brief.Should().Contain("Per-system rows do not sum to the portfolio headline.");
    }

    [Fact]
    public void Build_includes_execution_mode_evidence_basis_from_first_value_report()
    {
        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(FullInputs());

        brief.Should().Contain("**Evidence basis (execution mode):** **Simulator**");
    }

    [Fact]
    public void Build_demo_warning_shows_hold_disposition_and_demo_caveat()
    {
        SponsorPacketBuyerDecisionBriefBuilder.BriefInputs inputs = new(
            RunId,
            ManifestJson(demoDataWarning: true),
            SponsorReportJson(),
            LimitationsMd(),
            FirstValueReportMd());

        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(inputs);

        brief.Should().Contain("**WARN**");
        brief.Should().Contain("Demo data");
        brief.Should().Contain("synthetic or seeded data");
    }

    [Fact]
    public void Build_hold_reasons_produce_hold_disposition_and_caveat_lines()
    {
        SponsorPacketBuyerDecisionBriefBuilder.BriefInputs inputs = new(
            RunId,
            ManifestJson(),
            SponsorReportJson(),
            LimitationsMd(holdReasons: ["Run is not committed.", "ROI source catalog is missing."]),
            null);

        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(inputs);

        brief.Should().Contain("**HOLD**");
        brief.Should().Contain("Run is not committed.");
        brief.Should().Contain("Do not circulate externally");
    }

    [Fact]
    public void Build_missing_optional_artifacts_produces_explicit_fallbacks()
    {
        SponsorPacketBuyerDecisionBriefBuilder.BriefInputs inputs = new(
            RunId,
            null,
            null,
            null,
            null);

        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(inputs);

        brief.Should().Contain("# Buyer decision brief");
        brief.Should().Contain("Savings estimate not available");
        brief.Should().Contain("No hold or warn caveats");
    }

    [Fact]
    public void Build_does_not_overclaim_ai_or_certification()
    {
        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(FullInputs());

        // The brief must carry an explicit no-overclaim statement
        brief.Should().Contain("does not claim live Azure OpenAI");
        brief.Should().Contain("SOC certification");
    }

    [Fact]
    public void Build_artifact_catalog_includes_buyer_decision_brief_entry()
    {
        SponsorPacketArtifactCatalog.IndexEntries
            .Select(static e => e.FileName)
            .Should()
            .Contain(SponsorPacketArtifactCatalog.BuyerDecisionBriefFileName);
    }

    [Fact]
    public void Build_evidence_links_section_lists_all_catalog_entries()
    {
        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(FullInputs());

        foreach (SponsorPacketArtifactEntry entry in SponsorPacketArtifactCatalog.IndexEntries)
            brief.Should().Contain(entry.FileName, because: $"{entry.FileName} is in the catalog and should appear in evidence links");
    }

    [Fact]
    public void Build_first_value_paragraph_is_extracted_and_truncated_safely()
    {
        string longValue = new('x', 700);
        string report = $"# First value report\n\n{longValue}\n";
        SponsorPacketBuyerDecisionBriefBuilder.BriefInputs inputs = new(
            RunId,
            ManifestJson(),
            null,
            null,
            report);

        string brief = SponsorPacketBuyerDecisionBriefBuilder.Build(inputs);

        // Paragraph should be present and truncated to ≤600 chars + "..."
        brief.Should().Contain("...");
        brief.Length.Should().BeLessThan(5000);
    }
}
