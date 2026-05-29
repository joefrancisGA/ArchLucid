using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class SponsorFirstValuePdfGateTests
{
    [Fact]
    public void EnsureCanGenerate_throws_when_projected_dollars_not_sponsor_safe()
    {
        FirstValueReportBuildResult built = new(
            Markdown: "# report",
            EvidenceCompleteness: FirstValueEvidenceCompletenessLevel.Strong,
            SponsorProofReadiness: SponsorProofReadinessClassification.Sendable,
            ProofPackageCompleteness: new ProofPackageCompletenessResponse
            {
                AgentOutputPilotStrictEvidenceSatisfied = true,
                RoiBaselineInputs = new PilotRoiBaselineInputsStatusResponse
                {
                    ProjectedDollarClaimsSponsorSafe = false,
                },
            });

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().Throw<SponsorFirstValuePdfBlockedException>()
            .WithMessage("*projected-dollar*");
    }

    [Fact]
    public void EnsureCanGenerate_allows_when_proof_gates_pass()
    {
        FirstValueReportBuildResult built = new(
            Markdown: "# report",
            EvidenceCompleteness: FirstValueEvidenceCompletenessLevel.Strong,
            SponsorProofReadiness: SponsorProofReadinessClassification.Sendable,
            ProofPackageCompleteness: new ProofPackageCompletenessResponse
            {
                AgentOutputPilotStrictEvidenceSatisfied = true,
                RoiBaselineInputs = new PilotRoiBaselineInputsStatusResponse
                {
                    ProjectedDollarClaimsSponsorSafe = true,
                },
            });

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().NotThrow();
    }
}
