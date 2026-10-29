using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
/// Unit coverage for <see cref="EndToEndReplayComparisonExportService"/> export profiles (short vs default Markdown/HTML).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EndToEndReplayComparisonExportServiceTests
{
    [SkippableFact]
    public void GenerateMarkdown_short_profile_returns_header_and_summary_only()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Stub summary only");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left-run", RightRunId = "right-run", InterpretationNotes = ["should-not-appear-in-short"], Warnings = ["warn-hidden"],
        };

        string md = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Short);

        md.Should().Contain("left-run");
        md.Should().Contain("## Stub summary only");
        md.Should().NotContain("\n---\n");
        md.Should().NotContain("Interpretation Notes");
    }

    [SkippableFact]
    public void GenerateMarkdown_detailed_profile_uses_trimmed_nested_export_record_ids_in_export_diff_section()
    {
        EndToEndReplayComparisonExportService sut = new(new MarkdownEndToEndReplayComparisonSummaryFormatter());
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            RightRunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    LeftExportRecordId = "  left-anchor  ",
                    RightExportRecordId = "  right-anchor  ",
                    ChangedTopLevelFields = ["Format"],
                },
            ],
        };

        string md = sut.GenerateMarkdown(report, EndToEndComparisonExportProfile.Detailed);

        md.Should().Contain("### left-anchor -> right-anchor");
        md.Should().NotContain("  left-anchor  ");
    }

    [SkippableFact]
    public void GenerateMarkdown_default_profile_includes_separator_run_metadata_and_top_level_lists()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "L1", RightRunId = "R2", InterpretationNotes = ["note-a"], Warnings = ["warn-b"],
            FindingCorrelation = new ComparisonFindingCorrelationMetadata
            {
                PrimaryCorrelationMethod = nameof(FindingCorrelationMethod.PolicyRuleAndFingerprint),
                PolicyRuleMatchCount = 1,
                HonestyNote = "test honesty",
            },
        };

        string md = sut.GenerateMarkdown(report, profile: null);

        md.IndexOf("---", StringComparison.Ordinal).Should().BeGreaterThan(0, "default profile inserts a Markdown horizontal rule after the summary");
        md.Should().Contain("Finding correlation method:");
        md.Should().Contain("## Run Metadata Diff");
        md.Should().Contain("### Interpretation Notes");
        md.Should().Contain("note-a");
        md.Should().Contain("### Warnings");
        md.Should().Contain("warn-b");
    }

    [Fact]
    public void CompareQuality_GenerateHtml_includes_unmatched_finding_counts()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            FindingCorrelation = new ComparisonFindingCorrelationMetadata
            {
                PrimaryCorrelationMethod = nameof(FindingCorrelationMethod.PolicyRuleAndFingerprint),
                PolicyRuleMatchCount = 2,
                FuzzyMatchCount = 1,
                UnmatchedLeftCount = 4,
                UnmatchedRightCount = 3,
                HonestyNote = "Fuzzy matches are possible, not proven equivalence.",
            },
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Detailed);

        html.Should().Contain("Unmatched left findings: 4");
        html.Should().Contain("Unmatched right findings: 3");
        html.Should().Contain("Policy-rule matches: 2");
    }

    [SkippableFact]
    public void GenerateHtml_short_profile_omits_run_metadata_and_interpretation_sections()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("stub-summary-line");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "L",
            RightRunId = "R",
            RunDiff = new RunMetadataDiffResult { ChangedFields = ["FieldA"] },
            InterpretationNotes = ["hidden-in-short-html"],
        };

        string html = sut.GenerateHtml(report, EndToEndComparisonExportProfile.Short);

        html.Should().Contain("stub-summary-line");
        html.Should().NotContain("Run Metadata Diff");
        html.Should().NotContain("Interpretation Notes");
    }
}
