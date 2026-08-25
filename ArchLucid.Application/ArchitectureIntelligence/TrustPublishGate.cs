using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class TrustPublishGate : ITrustPublishGate
{
    public TrustPublishDecision Decide(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        IReadOnlyList<EvidenceValidationResult> validationResults,
        IReadOnlyList<MustNotFailViolation> mustNotFailViolations)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(recommendations);
        ArgumentNullException.ThrowIfNull(validationResults);
        ArgumentNullException.ThrowIfNull(mustNotFailViolations);

        HashSet<string> integrityPassedIds = validationResults
            .Where(result => result.OverallPassedIntegrity)
            .Select(result => result.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        List<MustNotFailViolation> blockingViolations = mustNotFailViolations
            .Where(violation => violation.Blocked)
            .ToList();

        HashSet<string> blockedFindingIds = ExtractBlockedFindingIds(blockingViolations);
        HashSet<string> blockedRecommendationIds = ExtractBlockedRecommendationIds(blockingViolations);

        List<SpecialistReviewFinding> publishableFindings = findings
            .Where(finding => integrityPassedIds.Contains(finding.FindingId))
            .Where(finding => !blockedFindingIds.Contains(finding.FindingId))
            .ToList();

        List<ArchitectureRecommendation> publishableRecommendations = recommendations
            .Where(recommendation => !blockedRecommendationIds.Contains(recommendation.RecommendationId))
            .ToList();

        List<string> blockReasons = blockingViolations
            .Select(violation => $"{violation.Class}: {violation.Message}")
            .Distinct(StringComparer.Ordinal)
            .ToList();

        // Hard must-not-fail violations block product publish even when other findings remain publishable.
        bool publishBlocked = blockingViolations.Count > 0;

        return new TrustPublishDecision
        {
            PublishableFindings = publishableFindings,
            PublishableRecommendations = publishableRecommendations,
            IntegrityPassedFindingIds = integrityPassedIds,
            PublishBlocked = publishBlocked,
            BlockReasons = blockReasons,
        };
    }

    private static HashSet<string> ExtractBlockedFindingIds(
        IReadOnlyList<MustNotFailViolation> blockingViolations)
    {
        HashSet<string> blocked = new(StringComparer.Ordinal);

        foreach (MustNotFailViolation violation in blockingViolations)
        {
            if (!string.IsNullOrWhiteSpace(violation.FindingId))
                blocked.Add(violation.FindingId);
        }

        return blocked;
    }

    private static HashSet<string> ExtractBlockedRecommendationIds(
        IReadOnlyList<MustNotFailViolation> blockingViolations)
    {
        HashSet<string> blocked = new(StringComparer.Ordinal);

        foreach (MustNotFailViolation violation in blockingViolations)
        {
            if (!string.IsNullOrWhiteSpace(violation.RecommendationId))
                blocked.Add(violation.RecommendationId);
        }

        return blocked;
    }
}
