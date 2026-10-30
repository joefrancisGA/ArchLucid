using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackPilotRunDeltasFindingsBySeverityPlainTextFormatterTests
{
    [Fact]
    public void Format_when_snapshot_sourced_and_empty_severity_does_not_claim_agent_results_missing()
    {
        PilotRunDeltas deltas = new()
        {
            AgentResultsIncludedInDetail = false,
            FindingsCountsFromSnapshot = true,
            FindingsBySeverity = [],
        };

        string text = PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas);

        text.Should().Contain("snapshot");
        text.Should().NotContain("agent results for this run");
    }

    [Fact]
    public void Format_when_agent_results_omitted_and_not_snapshot_sourced_uses_not_stored_copy()
    {
        PilotRunDeltas deltas = new()
        {
            AgentResultsIncludedInDetail = false,
            FindingsCountsFromSnapshot = false,
            FindingsBySeverity = [],
        };

        PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas)
            .Should()
            .Be(PilotSponsorMaterialFindingsHonestyCopy.AgentFindingsNotStored);
    }
}
