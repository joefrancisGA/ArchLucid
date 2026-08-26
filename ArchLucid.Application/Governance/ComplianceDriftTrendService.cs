using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.ComplianceDrift;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance;

/// <inheritdoc/>
public sealed class ComplianceDriftTrendService(
    IPolicyPackChangeLogRepository changeLogRepository,
    IComplianceDriftFindingsTrendReader findingsTrendReader,
    IScopeContextProvider scopeContextProvider) : IComplianceDriftTrendService
{
    private readonly IPolicyPackChangeLogRepository _changeLogRepository =
        changeLogRepository ?? throw new ArgumentNullException(nameof(changeLogRepository));

    private readonly IComplianceDriftFindingsTrendReader _findingsTrendReader =
        findingsTrendReader ?? throw new ArgumentNullException(nameof(findingsTrendReader));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc/>
    public async Task<IReadOnlyList<ComplianceDriftTrendPoint>> GetTrendAsync(Guid tenantId, DateTime fromUtc, DateTime toUtc, TimeSpan bucketSize,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        if (fromUtc >= toUtc)
            throw new ArgumentOutOfRangeException(nameof(toUtc), "toUtc must be greater than fromUtc.");
        if (bucketSize <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(bucketSize));

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<PolicyPackChangeLogEntry> entries =
            await _changeLogRepository.GetByTenantInRangeAsync(tenantId, fromUtc, toUtc, cancellationToken);

        IReadOnlyList<PolicyPackChangeLogEntry> scopedEntries = entries
            .Where(entry => entry.WorkspaceId == scope.WorkspaceId && entry.ProjectId == scope.ProjectId)
            .ToList();

        IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts> findingsBuckets =
            await _findingsTrendReader.GetBucketCountsAsync(
                tenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                fromUtc,
                toUtc,
                bucketSize,
                cancellationToken);

        long bucketTicks = bucketSize.Ticks;
        Dictionary<DateTime, Dictionary<string, int>> buckets = [];
        foreach (PolicyPackChangeLogEntry entry in scopedEntries)
        {
            long offsetTicks = entry.ChangedUtc.Ticks - fromUtc.Ticks;
            if (offsetTicks < 0)
                continue;
            long bucketIndex = offsetTicks / bucketTicks;
            DateTime bucketUtc = fromUtc.AddTicks(bucketIndex * bucketTicks);
            if (bucketUtc >= toUtc)
                continue;
            if (!buckets.TryGetValue(bucketUtc, out Dictionary<string, int>? byType))
            {
                byType = new Dictionary<string, int>(StringComparer.Ordinal);
                buckets[bucketUtc] = byType;
            }

            byType.TryGetValue(entry.ChangeType, out int n);
            byType[entry.ChangeType] = n + 1;
        }

        List<ComplianceDriftTrendPoint> points = [];
        for (DateTime bucket = fromUtc; bucket < toUtc; bucket = bucket.Add(bucketSize))
        {
            findingsBuckets.TryGetValue(bucket, out ComplianceDriftFindingsBucketCounts? findingsCounts);

            if (!buckets.TryGetValue(bucket, out Dictionary<string, int>? byType))
            {
                points.Add(new ComplianceDriftTrendPoint
                {
                    BucketUtc = bucket,
                    ChangeCount = 0,
                    ChangesByType = new Dictionary<string, int>(StringComparer.Ordinal),
                    OpenFindingsCount = findingsCounts?.OpenFindingsCount ?? 0,
                    ResolvedFindingsCount = findingsCounts?.ResolvedFindingsCount ?? 0,
                });
                continue;
            }

            int total = byType.Values.Sum();
            IReadOnlyDictionary<string, int> frozen = new Dictionary<string, int>(byType, StringComparer.Ordinal);
            points.Add(new ComplianceDriftTrendPoint
            {
                BucketUtc = bucket,
                ChangeCount = total,
                ChangesByType = frozen,
                OpenFindingsCount = findingsCounts?.OpenFindingsCount ?? 0,
                ResolvedFindingsCount = findingsCounts?.ResolvedFindingsCount ?? 0,
            });
        }

        return points;
    }
}
