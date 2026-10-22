using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Integrations;

/// <summary>All ITSM correlations for one finding in the current tenant scope.</summary>
public sealed class ItsmFindingCorrelationsByFindingResponse
{
    public string FindingId
    {
        get;
        set;
    } = string.Empty;

    private IReadOnlyList<ItsmFindingCorrelationListItem> correlations = [];

    public IReadOnlyList<ItsmFindingCorrelationListItem> Correlations
    {
        get => correlations;
        set => correlations = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
