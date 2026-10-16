using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Integrations;

/// <summary>ITSM correlations for multiple findings in the current tenant scope (batch list).</summary>
public sealed class ItsmFindingCorrelationsBatchResponse
{
    private IReadOnlyList<ItsmFindingCorrelationsByFindingResponse> findings = [];

    public IReadOnlyList<ItsmFindingCorrelationsByFindingResponse> Findings
    {
        get => findings;
        set => findings = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
