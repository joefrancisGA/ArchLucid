using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

internal sealed class AlwaysBlockedTrustPublishGate : ITrustPublishGate
{
    public TrustPublishDecision Decide(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        IReadOnlyList<EvidenceValidationResult> validationResults,
        IReadOnlyList<MustNotFailViolation> mustNotFailViolations)
    {
        return new TrustPublishDecision
        {
            PublishableFindings = findings.ToList(),
            PublishableRecommendations = recommendations.ToList(),
            IntegrityPassedFindingIds = validationResults
                .Where(result => result.OverallPassedIntegrity)
                .Select(result => result.FindingId)
                .ToHashSet(StringComparer.Ordinal),
            PublishBlocked = true,
            BlockReasons = ["Publish blocked for test."],
        };
    }
}
