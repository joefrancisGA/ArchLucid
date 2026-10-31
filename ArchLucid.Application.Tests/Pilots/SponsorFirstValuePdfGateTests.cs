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

    [Fact]
    public void EnsureCanGenerate_throws_when_roi_baseline_inputs_null_and_not_demo()
    {
        FirstValueReportBuildResult built = new(
            Markdown: "# report",
            EvidenceCompleteness: FirstValueEvidenceCompletenessLevel.Strong,
            SponsorProofReadiness: SponsorProofReadinessClassification.Sendable,
            ProofPackageCompleteness: new ProofPackageCompletenessResponse
            {
                DemoTenantWarningRequired = false,
                AgentOutputPilotStrictEvidenceSatisfied = true,
                RoiBaselineInputs = null,
            });

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().Throw<SponsorFirstValuePdfBlockedException>()
            .WithMessage("*projected-dollar*");
    }

    [Fact]
    public void EnsureCanGenerate_throws_when_pilot_strict_violates_and_proof_flag_stale_satisfied()
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
            },
            PilotRunDeltas: new PilotRunDeltas
            {
                AgentOutputPilotStrictSignalsResolved = true,
                AgentOutputPilotStrictViolatesSponsorEvidence = true,
            });

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().Throw<SponsorFirstValuePdfBlockedException>()
            .WithMessage("*PilotStrict*");
    }

    [Fact]
    public void EnsureCanGenerate_skips_projected_dollar_block_when_demo_on_deltas_not_stale_proof_flag()
    {
        FirstValueReportBuildResult built = new(
            Markdown: "# report",
            EvidenceCompleteness: FirstValueEvidenceCompletenessLevel.Strong,
            SponsorProofReadiness: SponsorProofReadinessClassification.Sendable,
            ProofPackageCompleteness: new ProofPackageCompletenessResponse
            {
                DemoTenantWarningRequired = false,
                AgentOutputPilotStrictEvidenceSatisfied = true,
                RoiBaselineInputs = null,
            },
            PilotRunDeltas: new PilotRunDeltas
            {
                IsDemoTenant = true,
                AgentOutputPilotStrictSignalsResolved = true,
                AgentOutputPilotStrictViolatesSponsorEvidence = false,
            });

        Action act = () => SponsorFirstValuePdfGate.EnsureCanGenerate(built);

        act.Should().NotThrow();
    }
}
