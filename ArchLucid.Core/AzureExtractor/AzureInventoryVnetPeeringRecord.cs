namespace ArchLucid.Core.AzureExtractor;

/// <summary>One stored virtual network peering entry from a VNet's peering collection.</summary>
public sealed class AzureInventoryVnetPeeringRecord
{
    public string? RemoteVirtualNetworkArmId
    {
        get;
        init;
    }

    public string? PeeringState
    {
        get;
        init;
    }
}
