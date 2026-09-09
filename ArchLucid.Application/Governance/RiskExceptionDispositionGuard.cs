using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

/// <summary>TB-154: block waivers when latest disposition is remediated.</summary>
public static class RiskExceptionDispositionGuard
{
    public static async Task EnsureWaiverAllowedForFindingAsync(
        IFindingReviewTrailRepository trailRepository,
        ScopeContext scope,
        string findingId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(trailRepository);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        IReadOnlyList<FindingReviewEventRecord> events =
            await trailRepository.ListByFindingAsync(scope.TenantId, findingId.Trim(), cancellationToken);

        List<FindingReviewEventRecord> scopedEvents = events
            .Where(reviewEvent =>
                reviewEvent.WorkspaceId == scope.WorkspaceId && reviewEvent.ProjectId == scope.ProjectId)
            .ToList();

        Disposition? latest = ResolveLatestDisposition(scopedEvents);

        if (latest == Disposition.Remediated)
        {
            throw new ArgumentException(
                "Cannot create or renew a risk exception when the finding's latest disposition is Remediated.",
                nameof(findingId));
        }
    }

    internal static Disposition? ResolveLatestDisposition(IReadOnlyList<FindingReviewEventRecord> events)
    {
        foreach (FindingReviewEventRecord reviewEvent in events)
        {
            if (reviewEvent.Disposition is not null)
                return reviewEvent.Disposition;
        }

        return null;
    }
}
