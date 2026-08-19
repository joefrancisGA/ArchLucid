using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportTraceFooterTests
{
    [Fact]
    public void ComposePageFooterText_includes_run_id_and_export_timestamp()
    {
        DateTimeOffset exportTimestampUtc = new(2026, 5, 22, 12, 0, 0, TimeSpan.Zero);

        string footer = ArchitectureReviewBoardExportTraceFooter.ComposePageFooterText(
            "Prepared by ArchLucid",
            "golden-run-001",
            exportTimestampUtc,
            activeTrialExportNotice: null);

        footer.Should().Contain("Run ID: golden-run-001");
        footer.Should().Contain("Exported UTC: 2026-05-22T12:00:00.0000000+00:00");
        footer.Should().StartWith("Prepared by ArchLucid");
    }
}
