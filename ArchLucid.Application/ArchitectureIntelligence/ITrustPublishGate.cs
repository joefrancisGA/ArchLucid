using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Central publish gate: stage-1 integrity + must-not-fail blocking (TB-1981 / TB-1991).
/// </summary>
public interface ITrustPublishGate
{
    TrustPublishDecision Decide(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        IReadOnlyList<EvidenceValidationResult> validationResults,
        IReadOnlyList<MustNotFailViolation> mustNotFailViolations);
}
