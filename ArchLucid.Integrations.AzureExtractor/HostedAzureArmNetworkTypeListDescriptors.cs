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

    internal const string NatGatewayApiVersion = "2023-09-01";

    internal const string FirewallApiVersion = "2023-09-01";

    internal const string VmssApiVersion = "2024-03-01";

    internal const string CdnApiVersion = "2023-05-01";

    internal const string FrontDoorApiVersion = "2020-05-01";

    internal const string ContainerAppsApiVersion = "2023-05-01";

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
        new("Microsoft.Network/natGateways", $"providers/Microsoft.Network/natGateways?api-version={NatGatewayApiVersion}"),
        new("Microsoft.Network/azureFirewalls", $"providers/Microsoft.Network/azureFirewalls?api-version={FirewallApiVersion}"),
        new("Microsoft.Compute/virtualMachineScaleSets", $"providers/Microsoft.Compute/virtualMachineScaleSets?api-version={VmssApiVersion}"),
        new("Microsoft.Cdn/profiles", $"providers/Microsoft.Cdn/profiles?api-version={CdnApiVersion}"),
        new("Microsoft.Network/frontDoors", $"providers/Microsoft.Network/frontDoors?api-version={FrontDoorApiVersion}"),
        new("Microsoft.App/containerApps", $"providers/Microsoft.App/containerApps?api-version={ContainerAppsApiVersion}"),
        new("Microsoft.App/managedEnvironments", $"providers/Microsoft.App/managedEnvironments?api-version={ContainerAppsApiVersion}"),
    ];
}

internal sealed record HostedAzureArmTypeListDescriptor(string ResourceType, string RelativePath);
