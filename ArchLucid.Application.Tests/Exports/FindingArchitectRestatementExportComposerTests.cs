using System.Text;

using ArchLucid.Application.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingArchitectRestatementExportComposerTests
{
    [Fact]
    public void AppendMarkdownSection_uses_trail_backed_honesty_label()
    {
        StringBuilder sb = new();

        FindingArchitectRestatementExportComposer.AppendMarkdownSection(
            sb,
            [
                new FindingArchitectRestatementExportRow
                {
                    FindingId = "finding-001",
                    FindingTitle = "Unencrypted queue",
                    Restatement = "We will present this as a backlog item with a 30-day remediation plan.",
                    OccurredAtUtc = new DateTimeOffset(2026, 9, 8, 12, 0, 0, TimeSpan.Zero),
                    IsTrailBacked = true,
                },
            ]);

        string markdown = sb.ToString();

        markdown.Should().Contain("Human judgment (architect restatements)");
        markdown.Should().Contain(FindingArchitectRestatementExportComposer.TrailBackedHonestyLabel);
        markdown.Should().Contain("We will present this as a backlog item with a 30-day remediation plan.");
        markdown.Should().Contain("do not rewrite sealed engine finding text");
    }

    [Fact]
    public void ResolveHonestyLabel_returns_not_trail_backed_copy_when_requested()
    {
        FindingArchitectRestatementExportComposer.ResolveHonestyLabel(false)
            .Should()
            .Be(FindingArchitectRestatementExportComposer.NotTrailBackedHonestyLabel);
    }
}
