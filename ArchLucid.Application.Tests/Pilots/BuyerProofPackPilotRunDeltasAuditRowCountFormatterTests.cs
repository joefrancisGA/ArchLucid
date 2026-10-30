using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackPilotRunDeltasAuditRowCountFormatterTests
{
    [Fact]
    public void FormatPlainText_when_truncated_discloses_query_cap_caveat()
    {
        PilotRunDeltas deltas = new()
        {
            AuditRowCount = 500,
            AuditRowCountTruncated = true,
        };

        PilotRunDeltasAuditRowCountFormatter.FormatPlainText(deltas)
            .Should()
            .Be($"500+ ({PilotRunDeltasAuditRowCountFormatter.TruncationCaveatPlain})");
    }

    [Fact]
    public void FormatMarkdownTableCell_when_truncated_discloses_query_cap_caveat()
    {
        PilotRunDeltas deltas = new()
        {
            AuditRowCount = 500,
            AuditRowCountTruncated = true,
        };

        PilotRunDeltasAuditRowCountFormatter.FormatMarkdownTableCell(deltas)
            .Should()
            .Contain(PilotRunDeltasAuditRowCountFormatter.TruncationCaveatPlain);
    }
}
