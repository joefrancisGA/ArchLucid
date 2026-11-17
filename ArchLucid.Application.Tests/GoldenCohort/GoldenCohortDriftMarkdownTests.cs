using System.Globalization;

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

    [SkippableFact]
    public void BuildCompactShaTable_lists_every_row_and_mismatch_counts()
    {
        GoldenCohortDriftRow[] rows =
        [
            new("gc-001", "aa", "bb", false, "Cost", "Cost", true),
            new("gc-002", "cc", "cc", true, "Cost", "Topology", false),
        ];

        string table = GoldenCohortDriftMarkdown.BuildCompactShaTable(rows);

        table.Should().Contain("gc-001\taa\tbb\tFalse\tTrue");
        table.Should().Contain("gc-002\tcc\tcc\tTrue\tFalse");
        table.Should().Contain("Summary: 1/2 SHA mismatch, 1/2 category mismatch.");
    }

    [SkippableFact]
    public void BuildCompactShaTable_twenty_rows_fit_under_fluentassertions_max_lines()
    {
        GoldenCohortDriftRow[] rows = Enumerable.Range(1, 20)
            .Select(static i => new GoldenCohortDriftRow(
                $"gc-{i.ToString("000", CultureInfo.InvariantCulture)}",
                "expected",
                "actual",
                false,
                "Cost",
                "Cost",
                true))
            .ToArray();

        string table = GoldenCohortDriftMarkdown.BuildCompactShaTable(rows);
        int lineCount = table.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length;

        lineCount.Should().BeLessThanOrEqualTo(22);
        table.Should().Contain("gc-020\texpected\tactual\tFalse\tTrue");
        table.Should().Contain("Summary: 20/20 SHA mismatch, 0/20 category mismatch.");
    }

    [SkippableFact]
    public void BuildCompactShaTable_throws_when_rows_null()
    {
        Action act = () => GoldenCohortDriftMarkdown.BuildCompactShaTable(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("rows");
    }
}
