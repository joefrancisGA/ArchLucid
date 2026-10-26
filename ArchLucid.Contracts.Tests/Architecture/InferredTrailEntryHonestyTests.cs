using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class InferredTrailEntryHonestyTests
{
    [Fact]
    public void FormatMarkdownExportLine_reports_missing_confidence_and_blank_value()
    {
        InferredTrailEntry entry = new()
        {
            Key = "signal",
            Value = " ",
            Confidence = 0,
        };

        entry.FormatMarkdownExportLine().Should().Contain(InferredTrailEntry.ConfidenceNotStoredLabel);
        entry.FormatMarkdownExportLine().Should().Contain(InferredTrailEntry.ValueStoredEmptyLabel);
    }
}
