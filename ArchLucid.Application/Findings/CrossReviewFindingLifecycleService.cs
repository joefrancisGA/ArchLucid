using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Findings;

/// <inheritdoc />
public sealed class CrossReviewFindingLifecycleService : ICrossReviewFindingLifecycleService
{
    private readonly IFindingReviewTrailRepository _reviewTrailRepository;

    public CrossReviewFindingLifecycleService(IFindingReviewTrailRepository reviewTrailRepository)
    {
        ArgumentNullException.ThrowIfNull(reviewTrailRepository);

        _reviewTrailRepository = reviewTrailRepository;
    }

    public async Task<CrossReviewFindingLifecycleResult> BuildAsync(
        CrossReviewFindingLifecycleRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        IReadOnlyDictionary<string, FindingDisposition> dispositions =
            await LoadPriorDispositionsAsync(request, cancellationToken);

        IReadOnlyList<CrossReviewFindingLifecycleRecord> records = CrossReviewFindingLifecycleResolver.Resolve(
            request.PriorFindings,
            request.CurrentFindings,
            request.Correlation,
            dispositions,
            request.SourceCoverage);

        return new CrossReviewFindingLifecycleResult
        {
            Records = records,
            Summary = CrossReviewFindingLifecycleSummarizer.Summarize(records),
        };
    }

    /// <summary>
    ///     Only findings that dropped out of the newer review need a disposition lookup — everything still present is
    ///     reported as still present regardless of how it was dispositioned.
    /// </summary>
    private async Task<IReadOnlyDictionary<string, FindingDisposition>> LoadPriorDispositionsAsync(
        CrossReviewFindingLifecycleRequest request,
        CancellationToken cancellationToken)
    {
        IReadOnlyCollection<string> droppedOutFindingIds = request.Correlation.UnmatchedLeftFindingIds;

        if (droppedOutFindingIds.Count == 0)
            return new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase);

        IReadOnlyList<FindingReviewEventRecord> reviewEvents =
            await _reviewTrailRepository.ListForFindingIdsSinceUtcAsync(
                request.TenantId,
                droppedOutFindingIds,
                request.DispositionsSinceUtc,
                cancellationToken);

        return CrossReviewLatestDispositionMap.Build(reviewEvents);
    }
}
