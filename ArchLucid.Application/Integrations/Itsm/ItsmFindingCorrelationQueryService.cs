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

        List<ItsmFindingCorrelationListItem> items = rows
            .Select(r => new ItsmFindingCorrelationListItem
            {
                Provider = r.Provider,
                ExternalKey = r.ExternalKey,
                ExternalSysId = r.ExternalSysId,
                CreatedUtc = r.CreatedUtc,
                ExternalUrl = _urlBuilder.TryBuildBrowseUrl(r.Provider, r.ExternalKey, r.ExternalSysId)
            })
            .ToList();

        return new ItsmFindingCorrelationsByFindingResponse
        {
            FindingId = trimmed,
            Correlations = items
        };
    }
}
