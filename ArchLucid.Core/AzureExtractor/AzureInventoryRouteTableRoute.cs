namespace ArchLucid.Core.AzureExtractor;

/// <summary>One user-defined route on a route table (NR-02).</summary>
public sealed class AzureInventoryRouteTableRoute
{
    public string? AddressPrefix
    {
        get;
        init;
    }

    public string? NextHopType
    {
        get;
        init;
    }

    public string? NextHopIpAddress
    {
        get;
        init;
    }

    public string? NextHopArmId
    {
        get;
        init;
    }
}
