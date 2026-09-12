namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Type-scoped ARM list GET descriptors for network relationship enrichment (IE-RF-03/06).
///     O(types) calls — not O(resources).
/// </summary>
internal static class HostedAzureArmNetworkTypeListDescriptors
{
    internal const string NetworkApiVersion = "2023-09-01";

    internal const string ComputeApiVersion = "2024-03-01";

    internal const string WebApiVersion = "2023-01-01";

    internal const string PrivateDnsApiVersion = "2020-06-01";

    internal static readonly HostedAzureArmTypeListDescriptor[] SubscriptionLists =
    [
        new("Microsoft.Network/networkInterfaces", $"providers/Microsoft.Network/networkInterfaces?api-version={NetworkApiVersion}"),
        new("Microsoft.Network/virtualNetworks", $"providers/Microsoft.Network/virtualNetworks?api-version={NetworkApiVersion}"),
        new("Microsoft.Network/networkSecurityGroups", $"providers/Microsoft.Network/networkSecurityGroups?api-version={NetworkApiVersion}"),
        new("Microsoft.Network/privateEndpoints", $"providers/Microsoft.Network/privateEndpoints?api-version={NetworkApiVersion}"),
        new("Microsoft.Compute/virtualMachines", $"providers/Microsoft.Compute/virtualMachines?api-version={ComputeApiVersion}"),
        new("Microsoft.Network/applicationGateways", $"providers/Microsoft.Network/applicationGateways?api-version={NetworkApiVersion}"),
        new("Microsoft.Network/loadBalancers", $"providers/Microsoft.Network/loadBalancers?api-version={NetworkApiVersion}"),
        new("Microsoft.Network/privateDnsZones", $"providers/Microsoft.Network/privateDnsZones?api-version={PrivateDnsApiVersion}"),
        new("Microsoft.Web/sites", $"providers/Microsoft.Web/sites?api-version={WebApiVersion}"),
    ];
}

internal sealed record HostedAzureArmTypeListDescriptor(string ResourceType, string RelativePath);
