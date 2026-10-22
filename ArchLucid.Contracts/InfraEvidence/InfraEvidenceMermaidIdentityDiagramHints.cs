using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidIdentityDiagramHints
{
    private List<InfraEvidenceMermaidIdentityDiagramSuppressedArmType> inventoryFilteredIdentityArmTypes = [];

    public List<InfraEvidenceMermaidIdentityDiagramSuppressedArmType> InventoryFilteredIdentityArmTypes
    {
        get => inventoryFilteredIdentityArmTypes;
        set => inventoryFilteredIdentityArmTypes = ContractCollectionDefaults.Coalesce(value);
    }
}

public sealed class InfraEvidenceMermaidIdentityDiagramSuppressedArmType
{
    public string ArmResourceType
    {
        get;
        set;
    } = string.Empty;

    public int ResourceCount
    {
        get;
        set;
    }
}
