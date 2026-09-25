namespace ArchLucid.Core.AzureExtractor;

/// <summary>Subnet or NIC association for a network security group (NR-02).</summary>
public sealed class AzureInventoryNsgAssociation
{
    public string? TargetArmId
    {
        get;
        init;
    }

    public string? TargetKind
    {
        get;
        init;
    }
}
