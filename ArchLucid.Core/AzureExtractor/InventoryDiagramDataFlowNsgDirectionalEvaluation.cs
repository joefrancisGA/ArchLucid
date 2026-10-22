namespace ArchLucid.Core.AzureExtractor;

/// <summary>Effective NSG evaluation for one connector direction (NR-08).</summary>
public sealed class InventoryDiagramDataFlowNsgDirectionalEvaluation
{
    public required string Direction
    {
        get;
        init;
    }

    public bool IsBlocked
    {
        get;
        init;
    }

    public string? EffectiveDisplayLabel
    {
        get;
        init;
    }

    public IReadOnlyList<InventoryDiagramDataFlowNsgRuleReference> SupportingRules
    {
        get;
        init;
    } = [];
}
