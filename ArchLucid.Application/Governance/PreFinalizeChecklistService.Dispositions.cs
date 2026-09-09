using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

public sealed partial class PreFinalizeChecklistService
{
    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private Task<IReadOnlyDictionary<string, Disposition>> LoadLatestDispositionsAsync(
        ScopeContext scope,
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken)
    {
        return PreFinalizeLatestDispositionLoader.LoadAsync(
            _findingReviewTrailRepository,
            scope,
            findings,
            cancellationToken);
    }
}
