using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reporting;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotValueReportMarkdownFormatterTests
{
    [Fact]
    public void Format_uses_export_formatter_for_timeline_dates()
    {
        ExportFormatterService fmt = new();
        PilotValueReportMarkdownFormatter sut = new(fmt);
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime committed = from.AddHours(2);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = committed,
                    SystemName = "test",
                },
            ],
        };

        string md = sut.Format(report);

        md.Should().Contain(fmt.FormatIso8601Utc(from));
        md.Should().Contain(fmt.FormatIso8601Utc(committed));
    }

    [Fact]
    public void Format_includes_sendable_export_cover_honesty_lines()
    {
        ExportFormatterService fmt = new();
        PilotValueReportMarkdownFormatter sut = new(fmt);
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
        };

        string md = sut.Format(report);

        md.Should().Contain("**Sponsor ROI honesty:**");
        md.Should().Contain(SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
        md.Should().Contain("**Policy influence:**");
        md.Should().Contain(SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
    }

    [Fact]
    public void Format_labels_missing_average_pipeline_completion_as_not_stored()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());

        string markdown = sut.Format(new PilotValueReport
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = DateTime.UtcNow.AddDays(-1),
            ToUtc = DateTime.UtcNow,
            AveragePipelineCompletionSeconds = null,
        });

        markdown.Should().Contain("Average pipeline completion was not stored.");
        markdown.Should().NotContain("| Avg pipeline completion | — |");
    }

    [Fact]
    public void Format_when_run_details_truncated_discloses_newest_run_sampling()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        int cap = PilotValueReportService.DefaultRunDetailCap;
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            TotalRunsCommitted = cap + 50,
            RunDetailsTruncated = true,
            RunDetailCap = cap,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("newest", "sponsor markdown must match TakeLast run-detail sampling");
        markdown.Should().NotContain("earliest", "earliest-run wording contradicts PilotValueReportService");
    }

    [Fact]
    public void Format_labels_empty_agent_types_system_name_and_missing_commit_time()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport report = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = from,
            ToUtc = from.AddDays(30),
            UniqueAgentTypes = [],
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run-1",
                    CreatedUtc = from,
                    CommittedUtc = null,
                    SystemName = "",
                },
            ],
            AveragePipelineCompletionSeconds = double.NaN,
        };

        string markdown = sut.Format(report);

        markdown.Should().Contain("Agent types were not stored.");
        markdown.Should().Contain("System name was not stored.");
        markdown.Should().Contain("Committed time was not stored.");
        markdown.Should().Contain("Average pipeline completion was not stored.");
    }
}
