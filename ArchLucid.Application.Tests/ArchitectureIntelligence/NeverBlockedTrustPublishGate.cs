using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

internal sealed class NeverBlockedTrustPublishGate : ITrustPublishGate
{
    public TrustPublishDecision Decide(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        IReadOnlyList<EvidenceValidationResult> validationResults,
        IReadOnlyList<MustNotFailViolation> mustNotFailViolations)
    {
        HashSet<string> integrityPassedIds = validationResults
            .Where(result => result.OverallPassedIntegrity)
            .Select(result => result.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        return new TrustPublishDecision
        {
            PublishableFindings = findings
                .Where(finding => integrityPassedIds.Contains(finding.FindingId))
                .ToList(),
            PublishableRecommendations = recommendations.ToList(),
            IntegrityPassedFindingIds = integrityPassedIds,
            PublishBlocked = false,
        };
    }
}
