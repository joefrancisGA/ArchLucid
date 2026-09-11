using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardSendableExportCoverRendererTests
{
    [Fact]
    public void AppendHtml_includes_sendable_export_cover_when_plain_text_present()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            ReviewId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            RunId = "00000000-0000-0000-0000-000000000001",
            SendableExportCoverPlainText = "Policy pack: default @ 1.0.0\nExecution mode: Real",
        };

        System.Text.StringBuilder html = new();
        ArchitectureReviewBoardSendableExportCoverRenderer.AppendHtml(html, model);

        string rendered = html.ToString();
        rendered.Should().Contain("Sendable export cover");
        rendered.Should().Contain("Policy pack: default @ 1.0.0");
        rendered.Should().Contain("Execution mode: Real");
    }
}
