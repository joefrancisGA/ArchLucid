using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Api.Contracts;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Api.Mapping;

internal static class RecommendationImproveLoopResponseMapper
{
    public static RecommendationImproveLoopEvidenceResponse? ToEvidenceResponse(
        RecommendationImproveLoopResult? improveLoop)
    {
        if (improveLoop is null)
            return null;

        List<string> mergedFindingIds = improveLoop.ReReview?.SpecialistResults
            .SelectMany(static result => result.Findings)
            .Select(static finding => finding.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToList() ?? [];

        return new RecommendationImproveLoopEvidenceResponse
        {
            DiffEntries = improveLoop.Diff.Entries,
            Impact = improveLoop.Impact,
            PartialScopeDisclaimer = improveLoop.PartialScopeDisclaimer,
            MergedFindingIds = mergedFindingIds,
            FullReReviewTriggered = improveLoop.ReReview?.FullReReviewTriggered ?? false,
        };
    }
}
