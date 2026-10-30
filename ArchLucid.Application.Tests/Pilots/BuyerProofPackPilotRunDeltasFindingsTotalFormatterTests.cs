using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

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

    [Fact]
    public void FormatFindingsTotal_when_top_finding_without_severity_buckets_does_not_emit_bare_zero()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "finding-pipe|1",
            FindingsBySeverity = [],
        };

        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas)
            .Should()
            .Be(PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel);
    }

    [Fact]
    public void FormatFindingsTotal_when_narrative_findings_without_severity_buckets_does_not_emit_bare_zero()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity = [],
            SponsorNarrativeFindings =
            [
                new ArchitectureFinding
                {
                    FindingId = "f-1",
                    Severity = FindingSeverity.Warning,
                },
            ],
        };

        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas)
            .Should()
            .Be(PilotRunDeltasFindingsTotalFormatter.FindingsTotalNotAttestedLabel);
    }

    [Fact]
    public void FormatFindingsTotal_when_snapshot_flag_but_top_finding_present_does_not_use_snapshot_zero_label()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsCountsFromSnapshot = true,
            FindingsBySeverity = [],
            TopFindingId = "f-1",
        };

        PilotRunDeltasFindingsTotalFormatter.FormatFindingsTotal(deltas)
            .Should()
            .NotBe(PilotRunDeltasFindingsTotalFormatter.SnapshotZeroUnmutedFindingsTotalLabel);
    }
}
