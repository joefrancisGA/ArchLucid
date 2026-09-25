namespace ArchLucid.Core.AzureExtractor;

/// <summary>Supporting NSG rule identity for on-demand data-flow connector detail (NR-08).</summary>
public sealed class InventoryDiagramDataFlowNsgRuleReference
{
    public required string NsgName
    {
        get;
        init;
    }

    public required string RuleName
    {
        get;
        init;
    }

    public string? Priority
    {
        get;
        init;
    }

    public required string Direction
    {
        get;
        init;
    }

    public required string AssociationKind
    {
        get;
        init;
    }
}
