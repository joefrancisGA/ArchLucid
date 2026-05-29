using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorEvidenceBasisLabelResolverTests
{
    [Fact]
    public void ResolveLabels_StrongProof_EvidenceBackedOnly()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        PilotRunDeltas deltas = new() { IsDemoTenant = false };
        ArchitectureRun run = new() { RealModeFellBackToSimulator = false };

        IReadOnlyList<string> labels = SponsorEvidenceBasisLabelResolver.ResolveLabels(proof, deltas, run);

        labels.Should().Equal("Evidence-backed");
        SponsorEvidenceBasisLabelResolver.DescribeVerdict(labels).Should().Contain("Evidence-backed");
    }

    [Fact]
    public void ResolveLabels_DemoAndLowSupport_IncludesBothLabels()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            DemoTenantWarningRequired = true,
            AgentOutputPilotStrictEvidenceSatisfied = false,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Low,
        };

        PilotRunDeltas deltas = new() { IsDemoTenant = true };
        ArchitectureRun run = new() { RealModeFellBackToSimulator = true };

        IReadOnlyList<string> labels = SponsorEvidenceBasisLabelResolver.ResolveLabels(proof, deltas, run);

        labels.Should().Contain("Demo-derived");
        labels.Should().Contain("Low support");
        labels.Should().Contain("Estimate");
        labels.Should().Contain("Manual review required");
        SponsorEvidenceBasisLabelResolver.DescribeVerdict(labels).Should().Contain("Demo-derived");
    }
}
