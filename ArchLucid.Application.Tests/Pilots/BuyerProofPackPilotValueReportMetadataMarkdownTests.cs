using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reporting;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackPilotValueReportMetadataMarkdownTests
{
    [Fact]
    public void Metadata_table_when_roi_freshness_disposition_contains_pipe_escapes_table_cell()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        string markdown = sut.Format(
            new PilotValueReport
            {
                TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                FromUtc = from,
                ToUtc = from.AddDays(30),
                RoiSourceFreshnessDisposition = "HOLD|stale",
            });

        string row = markdown.Split('\n')
            .Single(line => line.Contains("| ROI source freshness disposition |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| ROI source freshness disposition | HOLD\\|stale |");
    }

    [Fact]
    public void Metadata_table_when_roi_freshness_disposition_contains_newline_collapses_table_cell()
    {
        PilotValueReportMarkdownFormatter sut = new(new ExportFormatterService());
        DateTime from = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        string markdown = sut.Format(
            new PilotValueReport
            {
                TenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                FromUtc = from,
                ToUtc = from.AddDays(30),
                RoiSourceFreshnessDisposition = "HOLD\n| forged | row |",
            });

        markdown.Should().NotContain("\n| forged |");
        string row = markdown.Split('\n')
            .Single(line => line.Contains("| ROI source freshness disposition |", StringComparison.Ordinal))
            .TrimEnd();
        row.Should().Be("| ROI source freshness disposition | HOLD \\| forged \\| row \\| |");
    }
}
