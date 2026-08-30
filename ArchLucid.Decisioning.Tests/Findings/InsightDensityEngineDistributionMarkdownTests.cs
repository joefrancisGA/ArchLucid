using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class InsightDensityEngineDistributionMarkdownTests
{
    [Fact]
    public void Build_null_rows_throws()
    {
        Action act = () => InsightDensityEngineDistributionMarkdown.Build(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constants_document_harness_and_catalog_sizes()
    {
        InsightDensityEngineDistributionMarkdown.GoldenCorpusHarnessEngineCount.Should().Be(14);
        InsightDensityEngineDistributionMarkdown.BuiltInProductEngineCount.Should().Be(39);
    }

    [Fact]
    public void Build_empty_rows_matches_golden_header_and_table_shell()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([]);

        markdown.Should().Be(
            """
            # Insight-density engine distribution

            claimBoundary: Advisory-only measurement — scores do **not** demote typed-engine findings in production.
            DeterministicInsightDensityGate returns Promote / DecisionGradeFinding for non-agent findings
            (penalty reason `typed-engine-protected`); the computed score is visible here but is not a control.
            The golden corpus harness registers **14** engines; **0** appear in this table (≥1 finding across case-01..case-34). **39** built-in product engines are absent from this corpus-derived slice.
            `WouldDemoteIfUnprotectedCount` is a counterfactual (score below DemotionThreshold) — not production demotion behavior.

            Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
            Typed-engine-protected findings are never demoted in production — a low median signals engine output quality, not a gate bug.

            | Engine | Findings | Min | Median | Max | Would demote if unprotected |
            | --- | --- | --- | --- | --- | --- |


            """);
    }

    [Fact]
    public void Build_single_row_matches_golden_body_and_data_row()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([
            CreateRow("compliance", 1, 100, 100, 100, 0),
        ]);

        markdown.Should().Be(
            """
            # Insight-density engine distribution

            claimBoundary: Advisory-only measurement — scores do **not** demote typed-engine findings in production.
            DeterministicInsightDensityGate returns Promote / DecisionGradeFinding for non-agent findings
            (penalty reason `typed-engine-protected`); the computed score is visible here but is not a control.
            The golden corpus harness registers **14** engines; **1** appear in this table (≥1 finding across case-01..case-34). **38** built-in product engines are absent from this corpus-derived slice.
            `WouldDemoteIfUnprotectedCount` is a counterfactual (score below DemotionThreshold) — not production demotion behavior.

            Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
            Typed-engine-protected findings are never demoted in production — a low median signals engine output quality, not a gate bug.

            | Engine | Findings | Min | Median | Max | Would demote if unprotected |
            | --- | --- | --- | --- | --- | --- |
            | compliance | 1 | 100 | 100 | 100 | 0 |


            """);
    }

    [Fact]
    public void Build_distinct_engine_types_are_case_insensitive()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([
            CreateRow("topology", 2, 80, 85, 90, 0),
            CreateRow("TOPOLOGY", 1, 70, 75, 80, 1),
        ]);

        markdown.Should().Contain("**1** appear in this table");
        markdown.Should().Contain("**38** built-in product engines are absent");
        markdown.Should().Contain("| topology | 2 | 80 | 85 | 90 | 0 |");
        markdown.Should().Contain("| TOPOLOGY | 1 | 70 | 75 | 80 | 1 |");
    }

    [Fact]
    public void Build_absent_count_never_negative_when_table_exceeds_catalog()
    {
        List<InsightDensityEngineDistributionRow> rows = Enumerable
            .Range(0, 40)
            .Select(index => CreateRow($"engine-{index:D2}", 1, 50, 50, 50, 0))
            .ToList();

        string markdown = InsightDensityEngineDistributionMarkdown.Build(rows);

        markdown.Should().Contain("**40** appear in this table");
        markdown.Should().Contain("**0** built-in product engines are absent");
        markdown.Should().NotContain("**-1**");
    }

    private static InsightDensityEngineDistributionRow CreateRow(
        string engineType,
        int findingCount,
        int minScore,
        int medianScore,
        int maxScore,
        int wouldDemoteCount)
    {
        return new InsightDensityEngineDistributionRow
        {
            EngineType = engineType,
            FindingCount = findingCount,
            MinScore = minScore,
            MedianScore = medianScore,
            MaxScore = maxScore,
            WouldDemoteIfUnprotectedCount = wouldDemoteCount,
        };
    }
}
