using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Slim persisted improve-loop evidence for <c>Runs.ImproveLoopEvidenceJson</c>.
/// </summary>
public sealed class RecommendationImproveLoopEvidenceRecord
{
    public List<ArchitectureModelDiffEntry> DiffEntries
    {
        get;
        init;
    } = [];

    public ChangeImpactResult? Impact
    {
        get;
        init;
    }

    public string? PartialScopeDisclaimer
    {
        get;
        init;
    }

    public List<string> MergedFindingIds
    {
        get;
        init;
    } = [];

    public bool FullReReviewTriggered
    {
        get;
        init;
    }

    public static RecommendationImproveLoopEvidenceRecord? FromImproveLoopResult(
        RecommendationImproveLoopResult? improveLoop,
        IReadOnlyList<string>? mergedFindingIds = null)
    {
        if (improveLoop is null)
            return null;

        List<string> ids = mergedFindingIds?.ToList()
            ?? improveLoop.ReReview?.SpecialistResults
                .SelectMany(static result => result.Findings)
                .Select(static finding => finding.FindingId)
                .Where(static id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.Ordinal)
                .ToList()
            ?? [];

        return new RecommendationImproveLoopEvidenceRecord
        {
            DiffEntries = improveLoop.Diff.Entries.ToList(),
            Impact = improveLoop.Impact,
            PartialScopeDisclaimer = improveLoop.PartialScopeDisclaimer,
            MergedFindingIds = ids,
            FullReReviewTriggered = improveLoop.ReReview?.FullReReviewTriggered ?? false,
        };
    }
}
