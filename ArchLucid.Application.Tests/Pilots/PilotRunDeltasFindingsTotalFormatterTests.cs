using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotRunDeltasFindingsTotalFormatterTests
{
    [Fact]
    public void FormatFindingsTotal_when_no_severity_rows_narrative_or_top_finding_is_not_attested()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity = [],
            SponsorNarrativeFindings = [],
            TopFindingId = null,
        };

        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas)
            .Should()
            .Be(PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel);
    }

    [Fact]
    public void FormatFindingsTotal_sums_severity_rows_when_present()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 2), new KeyValuePair<string, int>("Critical", 1)],
        };

        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas).Should().Be("3");
    }
}
