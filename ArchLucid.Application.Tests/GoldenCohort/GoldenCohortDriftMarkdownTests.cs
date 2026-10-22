using ArchLucid.Core.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.Application.Tests.GoldenCohort;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenCohortDriftMarkdownTests
{
    [SkippableFact]
    public void BuildReport_includes_table_and_summary()
    {
        GoldenCohortDriftRow[] rows =
        [
            new("gc-001", "aa", "bb", false, "Cost", "Topology", false),
        ];

        string md = GoldenCohortDriftMarkdown.BuildReport(DateTimeOffset.Parse("2026-04-21T12:00:00Z"), rows, "Preamble line.");

        md.Should().Contain("# Golden cohort drift report");
        md.Should().Contain("gc-001");
        md.Should().Contain("Preamble line.");
        md.Should().Contain("1 / 1 items drifted.");
    }

    [SkippableFact]
    public void BuildReport_includes_model_quality_faithfulness_cost_and_budget_status()
    {
        GoldenCohortDriftRow[] rows =
        [
            new(
                "gc-real-001",
                "aa",
                "aa",
                true,
                "Cost",
                "Cost",
                true,
                "gpt-4o / compliance-system@v3",
                "pass",
                0.875,
                0.1234m,
                "skipped-token-budget-already-consumed"),
        ];

        string md = GoldenCohortDriftMarkdown.BuildReport(
            DateTimeOffset.Parse("2026-05-28T12:00:00Z"),
            rows,
            "Real-mode gate.");

        md.Should().Contain("Model / prompt");
        md.Should().Contain("gpt-4o / compliance-system@v3");
        md.Should().Contain("pass");
        md.Should().Contain("0.8750");
        md.Should().Contain("USD 0.1234");
        md.Should().Contain("skipped-token-budget-already-consumed");
    }
}
