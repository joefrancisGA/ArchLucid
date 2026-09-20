namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidIdentityDiagramHints
{
    public List<InfraEvidenceMermaidIdentityDiagramSuppressedArmType> InventoryFilteredIdentityArmTypes
    {
        get;
        set;
    } = [];
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
