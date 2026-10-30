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
    public void Format_when_severity_label_contains_apostrophe_quotes_and_escapes_label()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity = [new KeyValuePair<string, int>("O'Brien", 1)],
        };

        PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas)
            .Should()
            .Be("'O''Brien': 1");
    }

    [Fact]
    public void Format_when_severity_label_contains_backtick_quotes_label_in_plain_text_join()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity = [new KeyValuePair<string, int>("Warn`ing", 1)],
        };

        PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas)
            .Should()
            .Be("'Warn`ing': 1");
    }

    [Fact]
    public void Format_when_severity_label_contains_pipe_quotes_label_in_plain_text_join()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity = [new KeyValuePair<string, int>("Warn|ing", 2)],
        };

        PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas)
            .Should()
            .Be("'Warn|ing': 2");
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

    [Fact]
    public void Format_when_top_finding_without_severity_buckets_does_not_claim_no_findings_on_agent_results()
    {
        PilotRunDeltas deltas = new()
        {
            AgentResultsIncludedInDetail = true,
            FindingsCountsFromSnapshot = false,
            FindingsBySeverity = [],
            TopFindingId = "f-1",
        };

        PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas)
            .Should()
            .Be(PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel);
    }

    [Fact]
    public void Format_when_snapshot_flag_but_top_finding_present_does_not_use_snapshot_zero_copy()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsCountsFromSnapshot = true,
            FindingsBySeverity = [],
            TopFindingId = "f-1",
        };

        PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas)
            .Should()
            .Be(PilotRunDeltasFindingsEmptySeverityHonesty.FindingsBySeverityNotAttestedLabel);
    }
}
