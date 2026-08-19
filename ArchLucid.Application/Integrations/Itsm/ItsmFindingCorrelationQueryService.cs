using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Lists ITSM correlations for a finding and maps browse URLs (TB-063).</summary>
public sealed class ItsmFindingCorrelationQueryService(
    IItsmFindingCorrelationRepository correlations,
    ItsmExternalTicketUrlBuilder urlBuilder)
{
    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly ItsmExternalTicketUrlBuilder _urlBuilder =
        urlBuilder ?? throw new ArgumentNullException(nameof(urlBuilder));

    public async Task<ItsmFindingCorrelationsByFindingResponse> ListForFindingAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        string trimmed = findingId.Trim();

        IReadOnlyList<ItsmFindingCorrelationRecord> rows =
            await _correlations.ListByFindingAsync(scope.TenantId, trimmed, ct).ConfigureAwait(false);

        List<ItsmFindingCorrelationListItem> items = [];

        foreach (ItsmFindingCorrelationRecord row in rows)
        {
            items.Add(new ItsmFindingCorrelationListItem
            {
                Provider = row.Provider,
                ExternalKey = row.ExternalKey,
                ExternalSysId = row.ExternalSysId,
                CreatedUtc = row.CreatedUtc,
                ExternalUrl = await _urlBuilder.TryBuildBrowseUrlAsync(
                    scope.TenantId,
                    row.Provider,
                    row.ExternalKey,
                    row.ExternalSysId,
                    ct).ConfigureAwait(false)
            });
        }

        return new ItsmFindingCorrelationsByFindingResponse
        {
            FindingId = trimmed,
            Correlations = items
        };
    }

    public async Task<ItsmFindingCorrelationsBatchResponse> ListForFindingsAsync(
        ScopeContext scope,
        IReadOnlyList<string> findingIds,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (findingIds is null)
            throw new ArgumentNullException(nameof(findingIds));

        List<string> normalizedFindingIds = findingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (normalizedFindingIds.Count == 0)
        {
            return new ItsmFindingCorrelationsBatchResponse
            {
                Findings = Array.Empty<ItsmFindingCorrelationsByFindingResponse>()
            };
        }

        IReadOnlyList<ItsmFindingCorrelationRecord> rows =
            await _correlations.ListByFindingsAsync(scope.TenantId, normalizedFindingIds, ct).ConfigureAwait(false);

        Dictionary<string, List<ItsmFindingCorrelationListItem>> grouped = normalizedFindingIds
            .ToDictionary(static id => id, static _ => new List<ItsmFindingCorrelationListItem>(), StringComparer.Ordinal);

        foreach (ItsmFindingCorrelationRecord row in rows)
        {
            if (!grouped.TryGetValue(row.FindingId, out List<ItsmFindingCorrelationListItem>? items))
                continue;

            items.Add(new ItsmFindingCorrelationListItem
            {
                Provider = row.Provider,
                ExternalKey = row.ExternalKey,
                ExternalSysId = row.ExternalSysId,
                CreatedUtc = row.CreatedUtc,
                ExternalUrl = await _urlBuilder.TryBuildBrowseUrlAsync(
                    scope.TenantId,
                    row.Provider,
                    row.ExternalKey,
                    row.ExternalSysId,
                    ct).ConfigureAwait(false)
            });
        }

        List<ItsmFindingCorrelationsByFindingResponse> findings = normalizedFindingIds
            .Select(findingId => new ItsmFindingCorrelationsByFindingResponse
            {
                FindingId = findingId,
                Correlations = grouped[findingId]
            })
            .ToList();

        return new ItsmFindingCorrelationsBatchResponse
        {
            Findings = findings
        };
    }
}
