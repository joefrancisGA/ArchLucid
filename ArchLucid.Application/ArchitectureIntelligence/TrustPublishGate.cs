using ArchLucid.Application.InfraEvidence;
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

        HashSet<string> supportedIds = EvidenceSupportTierResolver.SupportedFindingIds(validationResults);
        List<SpecialistReviewFinding> publishableFindings = findings
            .Where(finding => supportedIds.Contains(finding.FindingId))
            .Where(finding => finding.PublicNetworkAccessDisabledResourceId is not Guid resourceId ||
                validationResults.Where(result => result.FindingId == finding.FindingId).All(result =>
                    result.PublicNetworkAccess is { Outcome: PublicNetworkAccessVerificationOutcome.Verified,
                        SnapshotId: not null, CapturedUtc: not null } proof && proof.CloudResourceId == resourceId))
            .Where(finding => !RequiresStorageTlsVerification(finding) ||
                finding.StorageMinimumTls12ResourceId is Guid tlsResourceId &&
                validationResults.Where(result => result.FindingId == finding.FindingId).All(result =>
                    result.StorageMinimumTls is { Outcome: StorageMinimumTlsOutcome.Verified, SnapshotId: not null,
                        CapturedUtc: not null, ResourceRowId: not null, ObservedVersion: StorageMinimumTlsVerification.ExpectedVersion }
                    proof && proof.CloudResourceId == tlsResourceId))
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

    internal static bool RequiresStorageTlsVerification(SpecialistReviewFinding finding) =>
        finding.StorageMinimumTls12ResourceId.HasValue ||
        InventoryStorageMinimumTlsVerifier.MentionsMinimumTls(finding.Title) ||
        InventoryStorageMinimumTlsVerifier.MentionsMinimumTls(finding.Rationale);

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
