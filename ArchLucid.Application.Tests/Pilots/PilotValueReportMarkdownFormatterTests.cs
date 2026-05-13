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
}
