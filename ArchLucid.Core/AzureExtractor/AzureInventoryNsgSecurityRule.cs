namespace ArchLucid.Core.AzureExtractor;

/// <summary>One security rule on a network security group (NR-02).</summary>
public sealed class AzureInventoryNsgSecurityRule
{
    public string? RuleName
    {
        get;
        init;
    }

    public string? Protocol
    {
        get;
        init;
    }

    public string? SourcePortRange
    {
        get;
        init;
    }

    public string? DestinationPortRange
    {
        get;
        init;
    }

    public string? Direction
    {
        get;
        init;
    }

    public string? Access
    {
        get;
        init;
    }

    public string? Priority
    {
        get;
        init;
    }

    public string? SourceAddressPrefix
    {
        get;
        init;
    }

    public string? DestinationAddressPrefix
    {
        get;
        init;
    }

    public IReadOnlyList<string> SourceAddressPrefixes
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> DestinationAddressPrefixes
    {
        get;
        init;
    } = [];
}
