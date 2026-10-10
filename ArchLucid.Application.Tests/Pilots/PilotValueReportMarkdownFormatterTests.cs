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
}
