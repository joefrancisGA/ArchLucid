using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class InsightDensityGateImpactWitnessTests
{
    private static readonly IInsightDensityGate Gate =
        new DeterministicInsightDensityGate(Microsoft.Extensions.Options.Options.Create(new InsightDensityGateOptions()));

    private sealed class HopPayloadFinding
    {
        public int HopCount
        {
            get;
            init;
        }
    }

    [Fact]
    public void Score_does_not_add_impact_witness_for_one_hop_path()
    {
        InsightDensityGateCandidate candidate = BuildCandidate(hops: 1);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.PenaltyReasons.Should().NotContain("impact-witness");
    }

    [Fact]
    public void Score_adds_impact_witness_for_two_hops_with_concrete_evidence()
    {
        InsightDensityGateCandidate candidate = BuildCandidate(hops: 2);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.PenaltyReasons.Should().Contain("impact-witness");
    }

    [Fact]
    public void Score_adds_ten_point_impact_witness_for_four_hops_capped_at_one_hundred()
    {
        InsightDensityGateCandidate candidate = BuildCandidate(hops: 4);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.PenaltyReasons.Should().Contain("impact-witness");
        result.InsightDensityScore.Should().BeLessThanOrEqualTo(100);
    }

    [Fact]
    public void Score_does_not_add_impact_witness_without_concrete_evidence()
    {
        InsightDensityGateCandidate candidate = new(
            "hop-no-evidence",
            "Machine actor reaches regulated datastore through Contributor role assignment.",
            [],
            FindingSeverity.Error,
            category: "Security",
            isAgentArchitectureFinding: false,
            engineType: "identity-blast-radius",
            relatedNodeIds: ["sql-prod"],
            impactHopCount: 6);

        InsightDensityGateResult result = Gate.Score(candidate, [candidate]);

        result.PenaltyReasons.Should().NotContain("impact-witness");
        result.PenaltyReasons.Should().Contain("no-concrete-evidence");
    }

    [Fact]
    public void FromFinding_reads_hop_count_from_identity_blast_radius_payload()
    {
        Finding finding = new()
        {
            FindingId = "hop-f1",
            EngineType = "identity-blast-radius",
            Title = "Machine actor reaches regulated datastore",
            Severity = FindingSeverity.Error,
            Category = "Security",
            EvidenceRefs = ["/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prod-db"],
            PayloadType = "IdentityBlastRadiusFindingPayload",
            Payload = new HopPayloadFinding { HopCount = 3 },
        };

        InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);

        candidate.ImpactHopCount.Should().Be(3);
    }

    private static InsightDensityGateCandidate BuildCandidate(int hops)
    {
        return new InsightDensityGateCandidate(
            $"hop-{hops}",
            "Machine actor reaches regulated datastore through Contributor role assignment.",
            ["/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/prod-db"],
            FindingSeverity.Error,
            category: "Security",
            isAgentArchitectureFinding: false,
            engineType: "identity-blast-radius",
            relatedNodeIds: ["sql-prod"],
            impactHopCount: hops);
    }
}
