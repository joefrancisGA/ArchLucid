using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackPilotRunDeltasFindingsTotalFormatterTests
{
    [Fact]
    public void FormatFindingsTotal_when_snapshot_sourced_empty_severity_does_not_claim_not_attested()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsCountsFromSnapshot = true,
            FindingsBySeverity = [],
        };

        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas)
            .Should()
            .Be(PilotRunDeltasFindingsTotalFormatter.SnapshotZeroUnmutedFindingsTotalLabel);
    }

    [Fact]
    public void FormatFindingsTotal_when_snapshot_sourced_empty_severity_aligns_with_by_severity_plain_text_honesty()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsCountsFromSnapshot = true,
            FindingsBySeverity = [],
        };

        string total = PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas);
        string bySeverity = PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas);

        total.Should().Contain("0");
        total.Should().Contain("snapshot");
        bySeverity.Should().Contain("snapshot");
    }
}
