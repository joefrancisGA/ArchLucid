namespace ArchLucid.Core.AzureExtractor;

/// <summary>NSG attachment and rule set for one subnet or NIC endpoint (NR-02, NR-08).</summary>
public sealed class InventoryDiagramDataFlowNsgEndpointAttachment
{
    public required string NsgArmId
    {
        get;
        init;
    }

    public required string NsgName
    {
        get;
        init;
    }

    public required string AssociationKind
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryNsgSecurityRule> Rules
    {
        get;
        init;
    } = [];
}
