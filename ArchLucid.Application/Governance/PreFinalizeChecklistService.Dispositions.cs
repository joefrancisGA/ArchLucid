using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

public sealed partial class PreFinalizeChecklistService
{
    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    private async Task<IReadOnlyDictionary<string, Disposition>> LoadLatestDispositionsAsync(
        ScopeContext scope,
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken)
    {
        List<string> findingIds = findings
            .Select(static finding => finding.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (findingIds.Count == 0)
            return new Dictionary<string, Disposition>(StringComparer.OrdinalIgnoreCase);

        DateTimeOffset since = _timeProvider.GetUtcNow() - FindingDispositionTrailWindow.BasisBreakdownLookback;

        IReadOnlyList<FindingReviewEventRecord> events =
            await _findingReviewTrailRepository
                .ListForFindingIdsSinceUtcAsync(scope.TenantId, findingIds, since, cancellationToken)
                .ConfigureAwait(false);

        return CrossReviewLatestDispositionMap.Build(events);
    }
}
