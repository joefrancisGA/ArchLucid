using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorSafeProofStatusMarkdownFormatterTests
{
    private static ArchitectureRun NonSimulatorRun() =>
        new()
        {
            RunId = "r",
            RequestId = "q",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = DateTime.UtcNow
        };

    [Fact]
    public void AppendMarkdownSection_includes_sponsor_proof_readiness_sendable()
    {
        StringBuilder sb = new();
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Complete,
            ProofPackageSendability.Sendable,
            [],
            [],
            []);

        SponsorSafeProofStatusMarkdownFormatter.AppendMarkdownSection(
            sb,
            SponsorSafeProofDisposition.Sendable,
            gate,
            StrongProof(),
            CompleteDeltas(topFindingId: null),
            NonSimulatorRun());

        string md = sb.ToString();
        md.Should().Contain("Sponsor-proof readiness:");
        md.Should().Contain("**Sendable**");
    }

    [Fact]
    public void ResolveDisposition_demo_only_is_not_sponsor_safe_yet()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.DemoOnly,
            ProofPackageSendability.NotSendable,
            ["demo"],
            [],
            []);

        SponsorSafeProofStatusMarkdownFormatter.ResolveDisposition(gate).Should().Be(SponsorSafeProofDisposition.NotSponsorSafeYet);
    }

    [Fact]
    public void ResolveDisposition_not_sendable_is_not_sponsor_safe_yet_even_if_tier_inconsistent()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Complete,
            ProofPackageSendability.NotSendable,
            [],
            ["hard"],
            []);

        SponsorSafeProofStatusMarkdownFormatter.ResolveDisposition(gate).Should().Be(SponsorSafeProofDisposition.NotSponsorSafeYet);
    }

    [Fact]
    public void ResolveDisposition_sendable_with_caveats_is_needs_operator_review()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Partial,
            ProofPackageSendability.SendableWithCaveats,
            [],
            [],
            ["soft"]);

        SponsorSafeProofStatusMarkdownFormatter.ResolveDisposition(gate).Should().Be(SponsorSafeProofDisposition.NeedsOperatorReview);
    }

    [Fact]
    public void ResolveDisposition_sendable_complete_is_sendable()
    {
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Complete,
            ProofPackageSendability.Sendable,
            [],
            [],
            []);

        SponsorSafeProofStatusMarkdownFormatter.ResolveDisposition(gate).Should().Be(SponsorSafeProofDisposition.Sendable);
    }

    [Fact]
    public void EnumerateConcreteGaps_sendable_strong_roi_yields_only_structural_all_clear_line()
    {
        ProofPackageCompletenessResponse proof = StrongProof();
        PilotRunDeltas deltas = CompleteDeltas(topFindingId: null);
        const SponsorSafeProofDisposition d = SponsorSafeProofDisposition.Sendable;

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter.EnumerateConcreteGapsEnumerable(
            d,
            proof,
            deltas,
            NonSimulatorRun()).ToList();

        gaps.Should().ContainSingle();

        gaps[0].Should().Contain("No remaining automated sponsor-blocking checks");
    }

    [Fact]
    public void EnumerateConcreteGaps_demo_tenant_calls_out_non_customer_proof()
    {
        ProofPackageCompletenessResponse proof = StrongProof(demoTenantWarningRequired: true);

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NotSponsorSafeYet,
                proof,
                CompleteDeltas(topFindingId: null),
                NonSimulatorRun())
            .ToList();

        gaps.Should().Contain(s => s.Contains("Demo", StringComparison.Ordinal));
        gaps.Should().Contain(s => s.Contains("customer ROI", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void EnumerateConcreteGaps_defaulted_baseline_is_explicit()
    {
        ProofPackageCompletenessResponse proof = StrongProof(roiEvidenceConfidence: PilotRoiEvidenceConfidence.Partial);

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                CompleteDeltas(topFindingId: null),
                NonSimulatorRun())
            .ToList();

        gaps.Should().Contain(s => s.Contains("baseline", StringComparison.OrdinalIgnoreCase));
    }

    private static ProofPackageCompletenessResponse StrongProof(
        bool demoTenantWarningRequired = false,
        PilotRoiEvidenceConfidence roiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong) =>
        new()
        {
            DemoTenantWarningRequired = demoTenantWarningRequired,
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            CommittedManifestTimestampResolved = true,
            RunInCommittedStatus = true,
            ArtifactDescriptorCount = 1,
            ArtifactDescriptorCountResolved = true,
            TimeToCommittedManifestResolved = true,
            FindingsBySeverityPresent = true,
            TopFindingEvidenceChainPresentOrNotApplicable = true,
            AuditRowsPresentOrLowerBound = true,
            LlmCallCountResolved = true,
            LlmCallCount = 0,
            RoiEvidenceConfidence = roiEvidenceConfidence,
            RoiConfidenceLabel = "tenant",
            BuyerSafeRedactionProfile = "x",
            PublishingTier = "Complete",
            ProofSendability = "Sendable",
            EvidenceCompleteness = "Strong",
            AgentOutputPilotStrictEvidenceSatisfied = true,
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Sendable),
        };

    private static PilotRunDeltas CompleteDeltas(string? topFindingId) =>
        new()
        {
            TopFindingId = topFindingId,
            AuditRowCount = 3,
            LlmCallCountResolved = true,
            SynthesizedArtifactDescriptorCountResolved = true,
            SynthesizedArtifactDescriptorCount = 1,
            IsDemoTenant = false,
        };
}
