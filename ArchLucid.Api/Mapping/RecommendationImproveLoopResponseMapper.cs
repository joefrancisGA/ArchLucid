using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Api.Contracts;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Api.Mapping;

internal static class RecommendationImproveLoopResponseMapper
{
    private static readonly JsonSerializerOptions PersistedEvidenceJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static RecommendationImproveLoopEvidenceResponse? TryParsePersistedEvidence(string? improveLoopEvidenceJson)
    {
        if (string.IsNullOrWhiteSpace(improveLoopEvidenceJson))
            return null;

        RecommendationImproveLoopResult? improveLoop = JsonSerializer.Deserialize<RecommendationImproveLoopResult>(
            improveLoopEvidenceJson,
            PersistedEvidenceJsonOptions);

        return ToEvidenceResponse(improveLoop);
    }

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
