using ArchLucid.Application.Pilots;
using ArchLucid.Persistence.Pilots;

namespace ArchLucid.Application.Tests.Pilots;

/// <summary>
///     Aligns pilot run deltas with <c>PilotBuyerSafeEvidenceGateEvaluatorTests.Evaluate_CommittedStrongBaseline_IsComplete</c>.
/// </summary>
internal static class PilotBuyerSafeStrongProofDeltas
{
    internal static PilotRunDeltas WithStrongProofFields(PilotRunDeltas deltas) =>
        deltas with
        {
            AuditRowCountResolved = true,
            LlmCallCountResolved = true,
            SynthesizedArtifactDescriptorCountResolved = true,
            SynthesizedArtifactDescriptorCount = deltas.SynthesizedArtifactDescriptorCount ?? 1,
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = false,
        };

    internal static PilotBaselineRecord BuyerProvidedScorecard(Guid tenantId) =>
        new()
        {
            TenantId = tenantId,
            BaselineHoursPerReview = 40m,
            BaselineReviewsPerQuarter = 12,
            BaselineArchitectHourlyCost = 175m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };
}
