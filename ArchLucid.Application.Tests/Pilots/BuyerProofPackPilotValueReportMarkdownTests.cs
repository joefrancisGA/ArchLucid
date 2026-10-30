using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reporting;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackPilotValueReportMarkdownTests
{
    [Fact]
    public void Pilot_value_report_timeline_when_run_id_contains_pipe_escapes_table_cell()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        string markdown = sut.Format(
            new PilotValueReport
            {
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                FromUtc = from,
                ToUtc = from.AddDays(7),
                CommittedRunsTimeline =
                [
                    new PilotValueReportRunTimelinePoint
                    {
                        RunId = "run|timeline",
                        CreatedUtc = from,
                        CommittedUtc = from.AddHours(1),
                        SystemName = "core",
                    },
                ],
            });

        string row = markdown.Split('\n')
            .Single(line => line.Contains("run|timeline", StringComparison.Ordinal) || line.Contains("run\\|timeline", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().StartWith("| `run\\|timeline` |");
    }

    [Fact]
    public void Pilot_value_report_timeline_when_system_name_contains_backtick_preserves_inline_code()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        string markdown = sut.Format(
            new PilotValueReport
            {
                TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                FromUtc = from,
                ToUtc = from.AddDays(7),
                CommittedRunsTimeline =
                [
                    new PilotValueReportRunTimelinePoint
                    {
                        RunId = "run-1",
                        CreatedUtc = from,
                        CommittedUtc = from.AddHours(1),
                        SystemName = "Pay`core",
                    },
                ],
            });

        markdown.Should().Contain("``Pay`core``");
    }

    [Fact]
    public void Pilot_value_report_agent_types_when_label_contains_pipe_preserves_inline_code()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        string markdown = sut.Format(
            new PilotValueReport
            {
                TenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                FromUtc = from,
                ToUtc = from.AddDays(7),
                UniqueAgentTypes = ["Topology|Review"],
            });

        markdown.Should().Contain("`Topology\\|Review`");
    }
}
