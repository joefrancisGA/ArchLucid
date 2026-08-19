using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

/// <summary>TB-154: block waivers when latest disposition is remediated.</summary>
public static class RiskExceptionDispositionGuard
{
    public static async Task EnsureWaiverAllowedForFindingAsync(
        IFindingReviewTrailRepository trailRepository,
        Guid tenantId,
        string findingId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(trailRepository);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        IReadOnlyList<FindingReviewEventRecord> events =
            await trailRepository.ListByFindingAsync(tenantId, findingId.Trim(), cancellationToken);

        Disposition? latest = ResolveLatestDisposition(events);

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
