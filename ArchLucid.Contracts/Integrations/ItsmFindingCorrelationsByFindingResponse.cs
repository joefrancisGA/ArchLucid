namespace ArchLucid.Contracts.Integrations;

/// <summary>All ITSM correlations for one finding in the current tenant scope.</summary>
public sealed class ItsmFindingCorrelationsByFindingResponse
{
    public string FindingId
    {
        get;
        set;
    } = string.Empty;

    public IReadOnlyList<ItsmFindingCorrelationListItem> Correlations
    {
        get;
        set;
    } = Array.Empty<ItsmFindingCorrelationListItem>();
}
