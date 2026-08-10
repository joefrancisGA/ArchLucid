namespace ArchLucid.Contracts.Integrations;

/// <summary>ITSM correlations for multiple findings in the current tenant scope (batch list).</summary>
public sealed class ItsmFindingCorrelationsBatchResponse
{
    public IReadOnlyList<ItsmFindingCorrelationsByFindingResponse> Findings
    {
        get;
        set;
    } = Array.Empty<ItsmFindingCorrelationsByFindingResponse>();
}
