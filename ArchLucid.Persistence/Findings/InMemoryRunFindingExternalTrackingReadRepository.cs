using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     In-memory batch projection for ITSM linkage only (<c>StorageProvider=InMemory</c>; no relational disposition rows).
/// </summary>
public sealed class InMemoryRunFindingExternalTrackingReadRepository(
    IItsmFindingCorrelationRepository correlations) : IRunFindingExternalTrackingReadRepository
{
    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow>> ListForFindingsAsync(
        Guid tenantId,
        Guid? findingsSnapshotId,
        IReadOnlyList<string> findingIds,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(findingIds);

        Dictionary<string, RunFindingExternalTrackingReadRow> result =
            new(StringComparer.Ordinal);

        foreach (string rawFindingId in findingIds)
        {
            if (string.IsNullOrWhiteSpace(rawFindingId))
                continue;

            string findingId = rawFindingId.Trim();

            if (result.ContainsKey(findingId))
                continue;

            IReadOnlyList<ItsmFindingCorrelationRecord> rows =
                await _correlations.ListByFindingAsync(tenantId, findingId, cancellationToken).ConfigureAwait(false);

            if (rows.Count == 0)
                continue;

            ItsmFindingCorrelationRecord primary = rows.OrderBy(static r => r.CreatedUtc).First();
            string summary = string.Join(
                "; ",
                rows.Select(static r => $"{r.Provider}:{r.ExternalKey}"));

            result[findingId] = new RunFindingExternalTrackingReadRow
            {
                FindingId = findingId,
                Provider = primary.Provider,
                ExternalKey = primary.ExternalKey,
                ExternalSysId = primary.ExternalSysId,
                ItsmLinkedTicketsSummary = summary
            };
        }

        return result;
    }
}
