namespace ArchLucid.Core.InfraEvidence;

/// <summary>One Azure Firewall network rule read from snapshot properties.</summary>
public sealed class AzureInventoryAzureFirewallNetworkRule
{
    public int Priority
    {
        get;
        init;
    }

    public string Action
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> SourceAddresses
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> DestinationAddresses
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> DestinationPorts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Protocols
    {
        get;
        init;
    } = [];
}
